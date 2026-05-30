/**
 * Admin overview service — per-organization data for the tenant Admin
 * Dashboard. Replaces the previous hardcoded mocks (systemStats,
 * recentUsers, pendingApprovals, activityLog, documentStats, weeklyData,
 * storageUsed).
 *
 * Every call is resilient: on error it returns a safe empty/zero value
 * rather than throwing, so a transient failure degrades to an empty
 * dashboard instead of a crash.
 *
 * Org-scoping: all queries filter by organization_id. RLS already
 * restricts to the caller's org; we filter explicitly so counts are
 * unambiguous and intent is clear.
 */
import { supabase } from '../lib/supabase';

export interface AdminSystemStats {
  documentsTotal: number;
  documentsChangePct: number; // vs last month
  usersActive: number;
  usersChangePct: number;
  workflowsActive: number;
  workflowsChangePct: number;
  signaturesThisMonth: number;
  signaturesChangePct: number;
}

export interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'away' | 'offline';
  lastActive: string; // pre-formatted relative time
}

export interface AdminPendingApproval {
  id: string;
  type: 'user' | 'workflow' | 'document';
  title: string;
  user: string;
  time: string;
  priority: 'high' | 'medium';
}

export interface AdminDocumentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfPrevMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function endOfPrevMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function changePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function safeCount(
  build: () => PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await build();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}j`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

/* -------------------------------------------------------------------- */
/* System stats (4 KPI cards)                                            */
/* -------------------------------------------------------------------- */

export async function getAdminSystemStats(orgId: string): Promise<AdminSystemStats> {
  const monthStart = startOfMonth().toISOString();
  const prevMonthStart = startOfPrevMonth().toISOString();
  const prevMonthEnd = endOfPrevMonth().toISOString();

  const [
    documentsTotal,
    docsThisMonth,
    docsLastMonth,
    usersActive,
    usersLastMonth,
    workflowsActive,
    workflowsLastMonth,
    signaturesThisMonth,
    signaturesLastMonth,
  ] = await Promise.all([
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .gte('created_at', monthStart)
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .gte('created_at', prevMonthStart)
        .lt('created_at', prevMonthEnd)
    ),
    safeCount(() =>
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('active', true)
    ),
    safeCount(() =>
      supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('active', true)
        .lt('invited_at', monthStart)
    ),
    safeCount(() =>
      supabase
        .from('workflow_instances')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['active', 'paused'])
    ),
    safeCount(() =>
      supabase
        .from('workflow_instances')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', prevMonthStart)
        .lt('created_at', prevMonthEnd)
    ),
    safeCount(() =>
      supabase
        .from('document_signatures')
        .select('id, documents!inner(organization_id)', { count: 'exact', head: true })
        .eq('documents.organization_id', orgId)
        .eq('status', 'signed')
        .gte('signed_at', monthStart)
    ),
    safeCount(() =>
      supabase
        .from('document_signatures')
        .select('id, documents!inner(organization_id)', { count: 'exact', head: true })
        .eq('documents.organization_id', orgId)
        .eq('status', 'signed')
        .gte('signed_at', prevMonthStart)
        .lt('signed_at', prevMonthEnd)
    ),
  ]);

  return {
    documentsTotal,
    documentsChangePct: changePct(docsThisMonth, docsLastMonth),
    usersActive,
    usersChangePct: changePct(usersActive, usersLastMonth),
    workflowsActive,
    workflowsChangePct: changePct(workflowsActive, workflowsLastMonth),
    signaturesThisMonth,
    signaturesChangePct: changePct(signaturesThisMonth, signaturesLastMonth),
  };
}

/* -------------------------------------------------------------------- */
/* Weekly activity (audit_logs grouped by day, last 7 days Mon→Sun)      */
/* -------------------------------------------------------------------- */

export async function getAdminWeeklyActivity(orgId: string): Promise<number[]> {
  try {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Mon=0
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    const fromIso = monday.toISOString();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('timestamp')
      .eq('organization_id', orgId)
      .gte('timestamp', fromIso)
      .limit(5000);

    if (error || !data) return new Array(7).fill(0);

    const counts = new Array(7).fill(0);
    for (const row of data) {
      const t = new Date(row.timestamp as string);
      const idx = (t.getDay() + 6) % 7; // Mon=0
      if (idx >= 0 && idx < 7) counts[idx]++;
    }
    return counts;
  } catch {
    return new Array(7).fill(0);
  }
}

/* -------------------------------------------------------------------- */
/* Recent users (latest org_members)                                     */
/* -------------------------------------------------------------------- */

function mapRoleLabel(role: string | null): string {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'editor':
    case 'manager':
      return 'Manager';
    case 'viewer':
    case 'user':
    default:
      return 'Utilisateur';
  }
}

function statusFromLastLogin(iso: string | null): 'active' | 'away' | 'offline' {
  if (!iso) return 'offline';
  const minutes = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (minutes < 15) return 'active';
  if (minutes < 60 * 4) return 'away';
  return 'offline';
}

export async function getAdminRecentUsers(orgId: string, limit = 4): Promise<AdminRecentUser[]> {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .select('id, name, email, role, last_login_at, invited_at, active')
      .eq('org_id', orgId)
      .eq('active', true)
      .order('last_login_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) => {
      const r = row as {
        id: string;
        name: string | null;
        email: string;
        role: string | null;
        last_login_at: string | null;
        invited_at: string | null;
      };
      return {
        id: r.id,
        name: r.name || r.email,
        email: r.email,
        role: mapRoleLabel(r.role),
        status: statusFromLastLogin(r.last_login_at),
        lastActive: relativeTime(r.last_login_at || r.invited_at),
      };
    });
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------- */
/* Pending approvals (docs in review + pending invites)                   */
/* -------------------------------------------------------------------- */

export async function getAdminPendingApprovals(
  orgId: string,
  limit = 3
): Promise<AdminPendingApproval[]> {
  const items: AdminPendingApproval[] = [];

  // 1) Documents pending review (highest signal for an admin)
  try {
    const { data } = await supabase
      .from('documents')
      .select('id, title, created_at, profiles ( first_name, last_name )')
      .eq('organization_id', orgId)
      .eq('status', 'pending_review')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    for (const row of data ?? []) {
      const r = row as {
        id: string;
        title: string | null;
        created_at: string;
        profiles?: { first_name?: string; last_name?: string } | null;
      };
      const fn = r.profiles?.first_name ?? '';
      const ln = r.profiles?.last_name ?? '';
      items.push({
        id: r.id,
        type: 'document',
        title: r.title || 'Document à valider',
        user: `${fn} ${ln}`.trim() || 'Utilisateur',
        time: relativeTime(r.created_at),
        priority: 'high',
      });
    }
  } catch {
    /* tolerate */
  }

  if (items.length >= limit) return items.slice(0, limit);

  // 2) Pending member invites (active=false, never logged in)
  try {
    const { data } = await supabase
      .from('org_members')
      .select('id, name, email, invited_at')
      .eq('org_id', orgId)
      .eq('active', false)
      .order('invited_at', { ascending: false })
      .limit(limit);

    for (const row of data ?? []) {
      const r = row as {
        id: string;
        name: string | null;
        email: string;
        invited_at: string | null;
      };
      items.push({
        id: r.id,
        type: 'user',
        title: 'Invitation en attente',
        user: r.name || r.email,
        time: relativeTime(r.invited_at),
        priority: 'medium',
      });
      if (items.length >= limit) break;
    }
  } catch {
    /* tolerate */
  }

  return items.slice(0, limit);
}

/* -------------------------------------------------------------------- */
/* Document status breakdown                                              */
/* -------------------------------------------------------------------- */

export async function getAdminDocumentStats(orgId: string): Promise<AdminDocumentStats> {
  const [total, approved, pending, rejected] = await Promise.all([
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .eq('status', 'approved')
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .eq('status', 'pending_review')
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .eq('status', 'rejected')
    ),
  ]);

  return { total, approved, pending, rejected };
}
