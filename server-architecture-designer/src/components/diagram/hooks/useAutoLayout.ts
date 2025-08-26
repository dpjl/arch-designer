import { useCallback } from 'react';
import { Node } from 'reactflow';
import { AutoLayoutConfig } from '@/types/diagram';
import { CONTAINER_HEADER_HEIGHT, NETWORK_HEADER_HEIGHT } from '../constants';
// Temporarily disable L-shape specific imports for auto-layout
// import { getLShapeAvailableRegions, adjustChildPositionForLShape } from '../utils/lshape-collision';

export const useAutoLayout = (globalConfig: AutoLayoutConfig) => {
  // Fonction pour vérifier si un nœud doit être bloqué
  const isNodeLocked = useCallback((node: Node | undefined, allNodes: Node[] = []): boolean => {
    if (!node) return false;
    if (!node.parentNode) return false;
    
  const parentNode = allNodes.find(n => n.id === node.parentNode);
    if (!parentNode || !parentNode.data?.autoLayout?.enabled) return false;
    
    return true;
  }, []);

  // Fonction pour calculer la hauteur réelle d'un nœud (les instances sont rendues sur la droite, pas au-dessus)
  const calculateRealNodeHeight = useCallback((node: Node): number => {
    // Hauteur de base du nœud
    let baseHeight = node.height || node.data?.height || node.style?.height || 60;
    
    return baseHeight;
  }, []);

  // NOTE: applyAutoLayout dépend des valeurs globales. Avant le correctif, il
  // capturait la version initiale de globalConfig (dépendances vides) et ne
  // reflétait pas les modifications ultérieures des paramètres globaux.
  // On ajoute donc globalConfig dans les dépendances pour que les nouvelles
  // valeurs (marges / espacements) soient appliquées aux conteneurs utilisant
  // useGlobalDefaults.
  const applyAutoLayout = useCallback((
    containerNode: Node,
    childNodes: Node[],
    nodes: Node[],
    autoLayoutConfig: AutoLayoutConfig
  ): Node[] => {
    if (!autoLayoutConfig.enabled || childNodes.length === 0) {
      return nodes;
    }

    // Filtrer les nœuds éligibles à l'auto-layout.
    // On EXCLUT explicitement les portes (type 'door') pour ne pas déplacer
    // leurs positions le long des bords du container. Les portes restent
    // où l'utilisateur (ou le snapping) les a placées.
    const layoutChildren = childNodes.filter(c => c.type !== 'door' && !(c as any).data?.isDoor);

    // Si après filtrage il ne reste rien à organiser, ne rien modifier.
    if (layoutChildren.length === 0) {
      return nodes;
    }

  const containerData = containerNode.data || {} as any;
  const containerWidth = (containerData.width || containerNode.width || 300) as number;
  const containerHeight = (containerData.height || containerNode.height || 200) as number;
  const headerPos = (containerData.headerPos || 'top') as 'top'|'left';
  const isNetwork = containerNode.type === 'network';
  const headerLeft = headerPos === 'left' ? (isNetwork ? NETWORK_HEADER_HEIGHT : CONTAINER_HEADER_HEIGHT) : 0;

    // Configuration effective : DIRECTEMENT depuis les valeurs globales si demandé
    const effectiveConfig = autoLayoutConfig.useGlobalDefaults ? {
      enabled: autoLayoutConfig.enabled,
      leftMargin: globalConfig.leftMargin,
      topMargin: globalConfig.topMargin,
      itemSpacing: globalConfig.itemSpacing,
      lineSpacing: globalConfig.lineSpacing,
      useGlobalDefaults: autoLayoutConfig.useGlobalDefaults
    } : autoLayoutConfig;

    // Configuration d'auto-layout
    const { leftMargin, topMargin, itemSpacing, lineSpacing } = effectiveConfig;

    // Initialize updatedNodes
    let updatedNodes = [...nodes];

    // Standard rectangular container layout (L-shape auto-layout disabled for now)
    
    // Partitions
    const partitions = Math.max(1, Math.min(12, parseInt(String(containerData.partitions ?? 1), 10) || 1));
    const innerWidth = containerWidth - headerLeft;
    const partitionWidth = innerWidth / partitions;

      // Ensure children have a stable partition assignment (data.parentPartition)
      // and clamp to valid range
      const childPartitionIndex: Record<string, number> = {};
      layoutChildren.forEach(c => {
        let idx: number | undefined = (c as any).data?.parentPartition;
        if (typeof idx !== 'number' || isNaN(idx)) {
          // infer from current x
          const localX = Math.max(0, (c.position.x - headerLeft));
          idx = Math.floor(localX / partitionWidth);
        }
        if (idx < 0) idx = 0; if (idx >= partitions) idx = partitions - 1;
        childPartitionIndex[c.id] = idx;
      });

      // We will accumulate updates here
      updatedNodes = nodes.map(node => {
        if (!childPartitionIndex[node.id]) return node;
        const idx = childPartitionIndex[node.id];
        const d = { ...(node as any).data, parentPartition: idx };
        return { ...node, data: d } as any;
      });

      // Helper to layout a subset (one partition)
      const layoutPartition = (subset: Node[], partitionIndex: number) => {
        // Trier les enfants en préservant l'ordre des colonnes existantes
        const sortedChildren = [...subset].sort((a, b) => {
        // Analyser si deux éléments sont dans la même colonne visuelle
        // (au moins un pixel en commun horizontalement)
        const aLeft = a.position.x;
        const aRight = a.position.x + (a.width || a.data?.width || a.style?.width || 150);
        const bLeft = b.position.x;
        const bRight = b.position.x + (b.width || b.data?.width || b.style?.width || 150);
        
        // Vérifier s'il y a un chevauchement horizontal (même colonne visuelle)
        const horizontalOverlap = Math.max(0, Math.min(aRight, bRight) - Math.max(aLeft, bLeft));
        const sameVisualColumn = horizontalOverlap > 0;
        
        if (sameVisualColumn) {
          // Même colonne visuelle : trier par position Y (haut vers bas)
          return a.position.y - b.position.y;
        } else {
          // Colonnes différentes : trier par position X (gauche vers droite), puis par Y
          const xDiff = a.position.x - b.position.x;
          if (Math.abs(xDiff) > 10) { // Seuil pour éviter les micro-différences
            return xDiff;
          }
          return a.position.y - b.position.y;
        }
        });

        // Calculer les nouvelles positions - REMPLISSAGE PAR COLONNES
        let currentColumn = 0;
        let currentYInColumn = topMargin;
        
        // Stocker les éléments par colonne pour calculer les largeurs
        const columnElements: { [key: number]: typeof sortedChildren } = {} as any;
        const columnWidths: { [key: number]: number } = {} as any;
        const elementPositions: { [key: string]: { x: number; y: number; column: number } } = {} as any;
        
        // Premier passage : répartir les éléments dans les colonnes
        sortedChildren.forEach((child) => {
        // Calculer la hauteur réelle de l'élément (y compris les onglets/instances)
        const nodeHeight = calculateRealNodeHeight(child);
        
        // Vérifier si l'élément rentre dans la colonne actuelle
          if (currentYInColumn + nodeHeight + topMargin > containerHeight && currentYInColumn > topMargin) {
          // Passer à la colonne suivante
          currentColumn++;
          currentYInColumn = topMargin;
        }
        
        // Ajouter l'élément à la colonne
        if (!columnElements[currentColumn]) {
          columnElements[currentColumn] = [];
        }
        columnElements[currentColumn].push(child);
        
        // Calculer la largeur réelle de l'élément
        const nodeWidth = child.width || child.data?.width || child.style?.width || 150;
        
        // Mettre à jour la largeur max de la colonne
        columnWidths[currentColumn] = Math.max(columnWidths[currentColumn] || 0, nodeWidth);
        
        // Stocker la position Y dans la colonne
        elementPositions[child.id] = {
          x: 0, // Sera calculé au deuxième passage
          y: currentYInColumn,
          column: currentColumn
        };
        
        // Mettre à jour la position Y pour le prochain élément dans cette colonne
        // Utiliser la hauteur réelle + interligne
        currentYInColumn += nodeHeight + lineSpacing;
        });

        // Deuxième passage : calculer les positions X et Y ajustées
        updatedNodes = updatedNodes.map(node => {
          const nodePosition = elementPositions[node.id];
          if (nodePosition && node.parentNode === containerNode.id && childPartitionIndex[node.id] === partitionIndex) {
            // Calculer la position X en additionnant les largeurs des colonnes précédentes
            let positionX = headerLeft + partitionIndex * partitionWidth + leftMargin;
            for (let col = 0; col < nodePosition.column; col++) {
              positionX += (columnWidths[col] || 0) + itemSpacing;
            }
            
            // Position Y inchangée: les instances n'ajoutent plus de hauteur au-dessus
            let positionY = nodePosition.y;
            
            return {
              ...node,
              position: { x: positionX, y: positionY }
            } as any;
          }
          return node;
        });
      };

      // Layout per partition
      for (let p = 0; p < partitions; p++) {
        const subset = layoutChildren.filter(c => childPartitionIndex[c.id] === p);
        if (subset.length > 0) layoutPartition(subset, p);
      }

    // Ajuster la taille du conteneur si nécessaire (jamais réduire)
    const updatedContainer = updatedNodes.find(n => n.id === containerNode.id) as any;
    if (updatedContainer) {
      // Compute max Y bottom across children to determine height
      let maxBottom = topMargin;
      updatedNodes.forEach(n => {
        if (n.parentNode !== containerNode.id) return;
        const h = (n as any).height || (n as any).data?.height || (n as any).style?.height || 80;
        const y = n.position.y + h;
        if (y > maxBottom) maxBottom = y;
      });
      const currentHeight = updatedContainer.data?.height || updatedContainer.height || 200;
      const newHeight = Math.max(currentHeight, maxBottom + topMargin);
      if (newHeight > currentHeight) {
        updatedContainer.data = { ...updatedContainer.data, height: newHeight };
      }
    }

    return updatedNodes;
  }, [globalConfig]);

  return { applyAutoLayout, isNodeLocked };
};
