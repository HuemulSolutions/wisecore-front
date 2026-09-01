import type { ExecutionRelationshipType, ExecutionRelationshipAttributeValue } from './execution-relationships'

// ─── Shared fragments ───────────────────────────────────────────────────────────

export type DiagramFlowNodeType = 'gateway' | 'start_event' | 'end_event'
export type DiagramNodeType = 'execution' | 'role' | DiagramFlowNodeType

export interface DiagramDocumentTypeRef {
  id: string
  name: string
  color: string
}

interface DiagramDetailBase {
  id: string
  diagram_id: string
  position: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Persisted entities (shape returned by GET, embedded in Diagram.details / Diagram.texts)
//
// Discriminated by `node_type` rather than optional fields on purpose: an execution
// detail and a role detail denormalize completely different data (document/execution
// vs role), so a union makes every site that reads execution-only fields off a role
// detail (or vice versa) a compile error instead of an `undefined` read at runtime.
export interface DiagramExecutionDetail extends DiagramDetailBase {
  node_type: 'execution'
  execution_id: string
  document_id: string
  // Denormalized by the backend so the canvas can render a node without
  // re-fetching the execution/document per detail (avoids an N+1 on load).
  execution_name: string
  document_name: string
  document_type: DiagramDocumentTypeRef
}

export interface DiagramRoleDetail extends DiagramDetailBase {
  node_type: 'role'
  role_id: string
  // Denormalized by the backend — no document_type/document_name/execution_name here.
  role_name: string
}

// A gateway/start_event/end_event detail — no execution/role behind it, just a
// label to show inside the node. Denormalizes nothing because there's nothing to
// denormalize; `label` is the only thing the backend persists for these besides
// position.
export interface DiagramFlowDetail extends DiagramDetailBase {
  node_type: DiagramFlowNodeType
  label: string | null
}

export type DiagramDetail = DiagramExecutionDetail | DiagramRoleDetail | DiagramFlowDetail

export interface DiagramText {
  id: string
  diagram_id: string
  content: string
  position: Record<string, unknown>
  has_border: boolean
  border_type: string | null
  border_color: string | null
  font_color: string | null
  font_family: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ─── Relationship endpoints ───────────────────────────────────────────────────

export interface DiagramExecutionEndpoint {
  node_type: 'execution'
  execution_id: string
  document_id: string
  document_name: string
  execution_name: string
  document_type: DiagramDocumentTypeRef
}

export interface DiagramRoleEndpoint {
  node_type: 'role'
  role_id: string
  role_name: string
}

// A gateway/start_event/end_event endpoint — identified by `detail_id` rather than
// a business id, because there's no entity behind it. Two diamonds on the same
// diagram are otherwise indistinguishable, so `detail_id` is the ONLY way to know
// which one a relationship's source/target actually points at.
export interface DiagramFlowEndpoint {
  node_type: DiagramFlowNodeType
  detail_id: string
  label: string | null
}

export type DiagramRelationshipEndpoint = DiagramExecutionEndpoint | DiagramRoleEndpoint | DiagramFlowEndpoint

interface DiagramRelationshipBase {
  id: string
  diagram_id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Discriminated by `execution_relationship_id` (string vs null) rather than optional
// fields — see the note on DiagramDetail above, same mechanical reason: today
// `relationship_type` is the closed union `ExecutionRelationshipType` and several
// sites compare it `=== 'manual'`. On a direct edge that field is a free label; with
// optional fields those comparisons would keep compiling and silently return false
// (showing an invented 0–∞ cardinality). With a discriminated union, every site that
// reads an execution-only field off a direct relationship (or vice versa) becomes a
// compile error — the actual worklist for wiring this up.
export interface DiagramExecutionRelationship extends DiagramRelationshipBase {
  execution_relationship_id: string
  source: DiagramExecutionEndpoint
  target: DiagramExecutionEndpoint
  relationship_type: ExecutionRelationshipType
  document_type_relationship: { id: string; name: string; min_count: number; max_count: number } | null
  attributes: ExecutionRelationshipAttributeValue[]
  // Legacy flat fields — kept for backward compat while the backend still sends
  // them, but every read site should prefer `source`/`target` above.
  source_execution_id: string
  target_execution_id: string
  execution_relationship_name: string | null
}

export interface DiagramDirectRelationship extends DiagramRelationshipBase {
  execution_relationship_id: null
  source: DiagramRelationshipEndpoint
  target: DiagramRelationshipEndpoint
  // Free label — no backing execution_relationship, so never compare to 'manual'/'default'.
  relationship_type: string | null
  name: string | null
  document_type_relationship?: null
  attributes?: never[]
}

export type DiagramRelationshipDetail = DiagramExecutionRelationship | DiagramDirectRelationship

export interface Diagram {
  id: string
  name: string
  execution_id: string
  description: string | null
  snapshot_media_id: string | null
  details: DiagramDetail[]
  texts: DiagramText[]
  relationships: DiagramRelationshipDetail[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface DiagramsResponse {
  transaction_id: string
  data: Diagram[]
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface DiagramResponse {
  data: Diagram
  transaction_id: string
  timestamp: string
}

// execution_id matches diagram.execution_id OR any diagram_detail.execution_id (resolved backend-side)
// document_id matches any diagram_detail.document_id (resolved backend-side)
export interface GetDiagramsParams {
  page?: number
  page_size?: number
  search?: string
  execution_id?: string
  document_id?: string
}

// ─── Input shapes for create/update bodies ─────────────────────────────────────
// No id/diagram_id/audit fields, those are backend-assigned. `node_type` is sent
// explicit even for the execution variant (matches the backend default, doesn't
// change the wire shape) so TS can discriminate the union the same way as reads.

// `key` is accepted by the backend on any detail (never persisted — request-scoped
// only, used to let a relationship point at a not-yet-created detail in the same
// request) but only the flow variant actually needs one here: execution/role
// details keep resolving relationships by their real `execution_id`/`role_id`,
// the already-proven path. A flow detail has no such id, so `key` is required for it.
export type DiagramDetailInput =
  | { node_type: 'execution'; execution_id: string; document_id: string; position: Record<string, unknown>; key?: string }
  | { node_type: 'role'; role_id: string; position: Record<string, unknown>; key?: string }
  | { node_type: DiagramFlowNodeType; label?: string | null; position: Record<string, unknown>; key: string }

export interface DiagramTextInput {
  content: string
  position: Record<string, unknown>
  has_border: boolean
  border_type?: string
  border_color?: string
  font_color?: string
  font_family?: string
}

// `?: never` on the sibling fields gives mutual exclusivity between the three ways
// of naming each endpoint (id / role id / key), without exploding into a separate
// interface per combination. `*_key` targets a detail by its request-scoped `key`
// (see `DiagramDetailInput` above) — used for gateway/start_event/end_event
// endpoints, and for an execution/role detail that was given a `key` too.
type DirectEdgeSource =
  | { source_execution_id: string; source_role_id?: never; source_key?: never }
  | { source_role_id: string; source_execution_id?: never; source_key?: never }
  | { source_key: string; source_execution_id?: never; source_role_id?: never }
type DirectEdgeTarget =
  | { target_execution_id: string; target_role_id?: never; target_key?: never }
  | { target_role_id: string; target_execution_id?: never; target_key?: never }
  | { target_key: string; target_execution_id?: never; target_role_id?: never }

export type DiagramRelationshipInput =
  | { execution_relationship_id: string }
  | (DirectEdgeSource & DirectEdgeTarget & {
      relationship_type?: string | null
      name?: string | null
      execution_relationship_id?: never
    })

export interface CreateDiagramRequest {
  name: string
  execution_id: string
  description?: string
  snapshot_media_id?: string | null
  // Backend requires at least 1 item (DIAGRAM_DETAILS_REQUIRED) — a role detail
  // satisfies this too, so a diagram made only of role nodes is valid.
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
  relationships: DiagramRelationshipInput[]
}

// PUT fully replaces details/texts/relationships (not a partial patch) — all required, mirroring CreateDiagramRequest
export interface UpdateDiagramRequest {
  name?: string
  execution_id?: string
  description?: string
  snapshot_media_id?: string | null
  details: DiagramDetailInput[]
  texts: DiagramTextInput[]
  relationships: DiagramRelationshipInput[]
}
