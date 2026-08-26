/**
 * Client API — communication avec le backend PHP (public/api/*.php)
 *
 * Toutes les requêtes utilisent des chemins RELATIFS ("api/plans.php",
 * pas "/api/plans.php") : l'app fonctionne quel que soit le sous-dossier
 * de déploiement (ex: tools.macerti.com/auditplan/), sans configuration,
 * du moment que api/ se trouve au même niveau que index.html.
 */

import type { StoredState } from '@/hooks/useAuditStore';

// ============================================================================
// Types
// ============================================================================

export type PlanPayload = StoredState;

export interface PlanSummary {
  id: number;
  name: string;
  clientRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetail extends PlanSummary {
  payload: PlanPayload;
}

/** Raw row shape as returned by the PHP API (snake_case columns). */
interface RawPlanRow {
  id: number;
  name: string;
  client_ref: string | null;
  created_at: string;
  updated_at: string;
  payload?: unknown;
}

// ============================================================================
// Internals
// ============================================================================

const API_BASE = 'api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Backend inaccessible. Vérifiez votre connexion ou la configuration du serveur.');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Réponse sans corps JSON (ex: 204 No Content) — ignoré.
  }

  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error ?? `Erreur serveur (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

function mapSummary(row: RawPlanRow): PlanSummary {
  return {
    id: row.id,
    name: row.name,
    clientRef: row.client_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Public API
// ============================================================================

/** Ping the health endpoint. Returns false on any failure (never throws). */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health.php`);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

/** List all saved plans (without their full payload), most recent first. */
export async function listPlans(): Promise<PlanSummary[]> {
  const rows = await request<RawPlanRow[]>('plans.php');
  return rows.map(mapSummary);
}

/** Fetch a single plan including its full payload. */
export async function getPlan(id: number): Promise<PlanDetail> {
  const row = await request<RawPlanRow>(`plans.php?id=${id}`);
  return { ...mapSummary(row), payload: row.payload as PlanPayload };
}

/** Create a new plan. Returns the new plan's id. */
export async function createPlan(
  name: string,
  payload: PlanPayload,
  clientRef?: string
): Promise<number> {
  const res = await request<{ id: number }>('plans.php', {
    method: 'POST',
    body: JSON.stringify({ name, clientRef, payload }),
  });
  return res.id;
}

/** Update an existing plan. Only the provided fields are changed. */
export async function updatePlan(
  id: number,
  updates: { name?: string; clientRef?: string; payload?: PlanPayload }
): Promise<void> {
  await request(`plans.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/** Delete a plan permanently. */
export async function deletePlan(id: number): Promise<void> {
  await request(`plans.php?id=${id}`, { method: 'DELETE' });
}
