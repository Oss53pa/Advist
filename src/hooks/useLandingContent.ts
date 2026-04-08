import { useState, useEffect } from 'react';

const ATLAS_SUPABASE_URL = 'https://vgtmljfayiysuvrcmunt.supabase.co';
const ATLAS_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZndG1samZheWl5c3V2cmNtdW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzgyMDUsImV4cCI6MjA4NjU1NDIwNX0.a2pyz1up8ZmZk-Tl51B0v6n3eVNkBPG5L_BJAM20qt4';

interface LandingSection {
  app_id: string;
  section: string;
  data: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

interface LandingContent {
  [key: string]: Record<string, unknown> | undefined;
}

export function useLandingContent(appId: string) {
  const [content, setContent] = useState<LandingContent>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(
          `${ATLAS_SUPABASE_URL}/rest/v1/app_landing_content?app_id=eq.${appId}&is_active=eq.true&order=sort_order`,
          { headers: { apikey: ATLAS_ANON_KEY, 'Content-Type': 'application/json' } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: LandingSection[] = await res.json();
        const map: LandingContent = {};
        for (const row of rows) {
          map[row.section] = row.data;
        }
        setContent(map);
      } catch (err) {
        console.error('useLandingContent error:', err);
        setError((err as Error).message);
      }
      setLoading(false);
    }
    fetchContent();
  }, [appId]);

  return { content, loading, error };
}
