/**
 * Custom hook for version comparison
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import versionCompareService, {
  CompareResponse,
  VersionListResponse,
  VersionSummaryResponse,
} from '../services/versionCompareService';

export interface UseVersionsResult {
  versions: VersionListResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseVersionCompareResult {
  compareResult: CompareResponse | null;
  isComparing: boolean;
  error: Error | null;
  compare: (leftVersionId: string, rightVersionId: string, noCache?: boolean) => Promise<void>;
  reset: () => void;
}

export interface UseVersionSummaryResult {
  summary: VersionSummaryResponse | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch all versions of a document
 */
export function useVersions(documentId: string): UseVersionsResult {
  const {
    data: versions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => versionCompareService.getVersions(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    versions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to compare two versions
 */
export function useVersionCompare(documentId: string): UseVersionCompareResult {
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compare = useCallback(
    async (leftVersionId: string, rightVersionId: string, noCache = false) => {
      setIsComparing(true);
      setError(null);

      try {
        const result = await versionCompareService.compareVersions(
          documentId,
          leftVersionId,
          rightVersionId,
          noCache
        );
        setCompareResult(result);
      } catch (err) {
        setError(err as Error);
        setCompareResult(null);
      } finally {
        setIsComparing(false);
      }
    },
    [documentId]
  );

  const reset = useCallback(() => {
    setCompareResult(null);
    setError(null);
  }, []);

  return {
    compareResult,
    isComparing,
    error,
    compare,
    reset,
  };
}

/**
 * Hook to get version history summary
 */
export function useVersionSummary(documentId: string): UseVersionSummaryResult {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['document-version-summary', documentId],
    queryFn: () => versionCompareService.getVersionsSummary(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    summary,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Combined hook for full version comparison workflow
 */
export function useFullVersionCompare(documentId: string) {
  const versions = useVersions(documentId);
  const compare = useVersionCompare(documentId);
  const summary = useVersionSummary(documentId);

  const selectVersionsToCompare = useCallback(
    (leftId: string, rightId: string) => {
      compare.compare(leftId, rightId);
    },
    [compare]
  );

  const compareWithPrevious = useCallback(
    (versionId: string) => {
      if (!versions.versions) return;

      const versionsList = versions.versions.versions;
      const currentIndex = versionsList.findIndex((v) => v.id === versionId);

      if (currentIndex < versionsList.length - 1) {
        const previousVersion = versionsList[currentIndex + 1];
        compare.compare(previousVersion.id, versionId);
      }
    },
    [versions.versions, compare]
  );

  const compareWithLatest = useCallback(
    (versionId: string) => {
      if (!versions.versions) return;

      const latestVersion = versions.versions.versions[0];
      if (latestVersion.id !== versionId) {
        compare.compare(versionId, latestVersion.id);
      }
    },
    [versions.versions, compare]
  );

  return {
    // Versions list
    versions: versions.versions,
    isLoadingVersions: versions.isLoading,
    versionsError: versions.error,
    refetchVersions: versions.refetch,

    // Comparison
    compareResult: compare.compareResult,
    isComparing: compare.isComparing,
    compareError: compare.error,
    selectVersionsToCompare,
    compareWithPrevious,
    compareWithLatest,
    resetCompare: compare.reset,

    // Summary
    summary: summary.summary,
    isLoadingSummary: summary.isLoading,
  };
}

export default useFullVersionCompare;
