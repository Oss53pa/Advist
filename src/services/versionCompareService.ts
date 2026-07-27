/**
 * Version Comparison Service — Supabase Implementation
 *
 * Handles document version comparison via direct Supabase queries.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Version {
  id: string;
  versionNumber: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  fileUrl?: string;
  fileSize?: number;
  comment?: string;
}

export interface Change {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  line: number;
  section?: string;
  oldContent?: string;
  newContent?: string;
  position: { x: number; y: number };
  page: number;
}

export interface DiffResult {
  leftVersionId: string;
  rightVersionId: string;
  changes: Change[];
  additionsCount: number;
  deletionsCount: number;
  modificationsCount: number;
  similarityRatio: number;
}

export interface CompareResponse {
  documentId: string;
  leftVersion: Version;
  rightVersion: Version;
  diff: DiffResult;
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    similarity: string;
    summaryText: string;
  };
}

export interface VersionListResponse {
  documentId: string;
  versions: Version[];
  total: number;
}

export interface VersionHistoryItem {
  fromVersion: string;
  toVersion: string;
  createdAt: string;
  createdBy: string;
  changes: {
    additions: number;
    deletions: number;
    modifications: number;
    total: number;
  };
  similarity: number;
  summaryText: string;
  error?: string;
}

export interface VersionSummaryResponse {
  documentId: string;
  versionCount: number;
  history: VersionHistoryItem[];
  message?: string;
}

// ---------------------------------------------------------------------------
// Row → Version mapper
// ---------------------------------------------------------------------------

function mapVersion(data: Record<string, any>): Version {
  return {
    id: data.id,
    versionNumber: String(data.version_number),
    createdAt: data.created_at,
    createdBy: data.created_by_user
      ? {
          id: data.created_by_user.id,
          name: `${data.created_by_user.first_name} ${data.created_by_user.last_name}`,
        }
      : { id: data.created_by || '', name: '' },
    fileUrl: data.file_path,
    fileSize: data.file_size,
    comment: data.changes_summary,
  };
}

// ---------------------------------------------------------------------------
// Select fragment
// ---------------------------------------------------------------------------

const VERSION_SELECT = `
  *,
  created_by_user:profiles!document_versions_created_by_fkey(id, first_name, last_name)
`;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class VersionCompareService {
  /**
   * Get all versions of a document
   */
  async getVersions(documentId: string): Promise<VersionListResponse> {
    const { data, error } = await supabase
      .from('document_versions')
      .select(VERSION_SELECT)
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);

    return {
      documentId,
      versions: (data || []).map(mapVersion),
      total: (data || []).length,
    };
  }

  /**
   * Compare two versions of a document
   *
   * Note: Detailed content-based diffing requires an Edge Function (Phase 5).
   * For now, this returns metadata comparison and an empty changes array.
   */
  async compareVersions(
    documentId: string,
    leftVersionId: string,
    rightVersionId: string,
    _noCache = false
  ): Promise<CompareResponse> {
    const { data, error } = await supabase
      .from('document_versions')
      .select(VERSION_SELECT)
      .eq('document_id', documentId)
      .in('id', [leftVersionId, rightVersionId]);

    if (error) throw new Error(parseSupabaseError(error).message);

    const left = data?.find((v: any) => v.id === leftVersionId);
    const right = data?.find((v: any) => v.id === rightVersionId);

    if (!left || !right) throw new Error('Version(s) non trouvée(s)');

    const leftVersion = mapVersion(left);
    const rightVersion = mapVersion(right);

    return {
      documentId,
      leftVersion,
      rightVersion,
      diff: {
        leftVersionId,
        rightVersionId,
        changes: [],
        additionsCount: 0,
        deletionsCount: 0,
        modificationsCount: 0,
        similarityRatio: 1,
      },
      summary: {
        totalChanges: 0,
        additions: 0,
        deletions: 0,
        modifications: 0,
        similarity: '100%',
        summaryText:
          'Comparaison de métadonnées uniquement. La comparaison de contenu sera disponible avec les Edge Functions.',
      },
    };
  }

  /**
   * Get version changes summary (all versions history)
   */
  async getVersionsSummary(documentId: string): Promise<VersionSummaryResponse> {
    const { data, error } = await supabase
      .from('document_versions')
      .select(VERSION_SELECT)
      .eq('document_id', documentId)
      .order('version_number', { ascending: true });

    if (error) throw new Error(parseSupabaseError(error).message);

    const versions = data || [];
    const history: VersionHistoryItem[] = [];

    for (let i = 1; i < versions.length; i++) {
      const prev = versions[i - 1] as Record<string, any>;
      const curr = versions[i] as Record<string, any>;
      history.push({
        fromVersion: String(prev.version_number),
        toVersion: String(curr.version_number),
        createdAt: curr.created_at,
        createdBy: curr.created_by_user
          ? `${curr.created_by_user.first_name} ${curr.created_by_user.last_name}`
          : '',
        changes: { additions: 0, deletions: 0, modifications: 0, total: 0 },
        similarity: 1,
        summaryText: curr.changes_summary || '',
      });
    }

    return {
      documentId,
      versionCount: versions.length,
      history,
      message: versions.length <= 1 ? "Ce document n'a qu'une seule version." : undefined,
    };
  }
}

export const versionCompareService = new VersionCompareService();
export default versionCompareService;
