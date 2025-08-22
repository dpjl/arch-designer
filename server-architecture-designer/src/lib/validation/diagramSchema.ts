import { z } from 'zod';

// Minimal node schema; keep permissive for forward-compat, but ensure essentials
export const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  data: z.record(z.string(), z.any()).optional().or(z.object({}).passthrough()).optional(),
  parentNode: z.string().optional(),
  style: z.record(z.string(), z.any()).optional().or(z.object({}).passthrough()).optional(),
}).passthrough();

export const EdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().optional(),
  data: z.record(z.string(), z.any()).optional().or(z.object({}).passthrough()).optional(),
  style: z.record(z.string(), z.any()).optional().or(z.object({}).passthrough()).optional(),
}).passthrough();


export const DiagramPayloadSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  groups: z.array(z.any()).optional(),
  instanceGroups: z.array(z.any()).optional(),
  globalAutoLayoutConfig: z.record(z.string(), z.any()).optional().or(z.object({}).passthrough()).optional(),
});

export type DiagramPayload = z.infer<typeof DiagramPayloadSchema>;
