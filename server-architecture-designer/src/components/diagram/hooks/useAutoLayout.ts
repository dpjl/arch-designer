import { useCallback } from 'react';
import { Node } from 'reactflow';
import { AutoLayoutConfig } from '@/types/diagram';

export const useAutoLayout = (globalConfig: AutoLayoutConfig) => {
  // Fonction pour vérifier si un nœud doit être bloqué
  const isNodeLocked = useCallback((node: Node, allNodes: Node[]): boolean => {
    if (!node.parentNode) return false;
    
    const parentNode = allNodes.find(n => n.id === node.parentNode);
    if (!parentNode || !parentNode.data?.autoLayout?.enabled) return false;
    
    return true;
  }, []);

  // Fonction pour calculer la hauteur réelle d'un nœud (incluant les onglets instances)
  const calculateRealNodeHeight = useCallback((node: Node): number => {
    // Hauteur de base du nœud
    let baseHeight = node.height || node.data?.height || node.style?.height || 60;
    
    // Si le nœud a des instances, ajouter la hauteur des onglets
    if (node.data?.instances && Array.isArray(node.data.instances) && node.data.instances.length > 0) {
      // Hauteur approximative des onglets d'instances : 24px (padding + border + texte)
      baseHeight += 24;
    }
    
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

    const containerData = containerNode.data || {};
    const containerWidth = containerData.width || containerNode.width || 300;
    const containerHeight = containerData.height || containerNode.height || 200;

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
    const {
      leftMargin,
      topMargin,
      itemSpacing,
      lineSpacing
    } = effectiveConfig;

    // Calcul de l'espace disponible pour les éléments
    const availableWidth = containerWidth - (leftMargin * 2);
    const availableHeight = containerHeight - (topMargin * 2);
    
    // Trier les enfants en préservant l'ordre des colonnes existantes
  const sortedChildren = [...layoutChildren].sort((a, b) => {
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
    let newHeight = topMargin;
    
    // Stocker les éléments par colonne pour calculer les largeurs
    const columnElements: { [key: number]: typeof sortedChildren } = {};
    const columnWidths: { [key: number]: number } = {};
    const elementPositions: { [key: string]: { x: number; y: number; column: number } } = {};
    
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
      newHeight = Math.max(newHeight, currentYInColumn + topMargin);
    });
    
    // Deuxième passage : calculer les positions X et Y ajustées
    const updatedNodes = nodes.map(node => {
      const nodePosition = elementPositions[node.id];
      
      if (nodePosition && node.parentNode === containerNode.id) {
        // Calculer la position X en additionnant les largeurs des colonnes précédentes
        let positionX = leftMargin;
        for (let col = 0; col < nodePosition.column; col++) {
          positionX += (columnWidths[col] || 0) + itemSpacing;
        }
        
        // Calculer la position Y ajustée pour les onglets d'instances
        let positionY = nodePosition.y;
        if (node.data?.instances && Array.isArray(node.data.instances) && node.data.instances.length > 0) {
          // Décaler vers le bas pour laisser l'espace aux onglets au-dessus
          positionY += 24;
        }
        
        return {
          ...node,
          position: { x: positionX, y: positionY }
        };
      }
      
      return node;
    });

    // Ajuster la taille du conteneur si nécessaire (jamais réduire)
    const updatedContainer = updatedNodes.find(n => n.id === containerNode.id);
    if (updatedContainer) {
      const currentHeight = updatedContainer.data?.height || updatedContainer.height || 200;
      if (newHeight > currentHeight) {
        updatedContainer.data = {
          ...updatedContainer.data,
          height: newHeight
        };
      }
    }

    return updatedNodes;
  }, [globalConfig]);

  return { applyAutoLayout, isNodeLocked };
};
