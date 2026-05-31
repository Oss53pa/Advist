-- ════════════════════════════════════════════════════════════════════
-- Document Links — typed relationships between two documents
-- ════════════════════════════════════════════════════════════════════
-- Lets a document point to other documents with a labelled relationship
-- (annex, parent contract, amendment, supersedes, etc.). Used by the
-- "Documents liés" panel in DocumentDetailPage.
--
-- Stored as a DIRECTED edge (source → target). Callers can query both
-- directions (UNION on source_document_id / target_document_id) to
-- render an undirected list when desired.
--
-- RLS posture: callers can SELECT/INSERT/DELETE rows whose `source` AND
-- `target` documents are both in their org. No cross-org links by
-- construction.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS document_links (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    -- Free-form label so we don't have to enumerate every business
    -- relationship in an enum. UI restricts to a short list (annex,
    -- parent, amendment, supersedes, related); db is permissive.
    relationship         VARCHAR(50) NOT NULL DEFAULT 'related',
    note                 TEXT,
    created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT chk_doc_links_no_self CHECK (source_document_id != target_document_id),
    UNIQUE (source_document_id, target_document_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_doc_links_source ON document_links(source_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_links_target ON document_links(target_document_id);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Helper-free policy: rely on the documents row's org via JOIN.
-- Consistent with how collaboration_chat_messages / document_versions /
-- workflow_assignees are scoped (no organization_id on the link row
-- itself; the source document is the org anchor).

DROP POLICY IF EXISTS "document_links_select" ON document_links;
CREATE POLICY "document_links_select" ON document_links FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = source_document_id
          AND d.organization_id = public.get_user_org_id()
    )
);

DROP POLICY IF EXISTS "document_links_insert" ON document_links;
CREATE POLICY "document_links_insert" ON document_links FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = source_document_id
          AND d.organization_id = public.get_user_org_id()
    )
    AND EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = target_document_id
          AND d.organization_id = public.get_user_org_id()
    )
);

DROP POLICY IF EXISTS "document_links_delete" ON document_links;
CREATE POLICY "document_links_delete" ON document_links FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = source_document_id
          AND d.organization_id = public.get_user_org_id()
    )
    AND (
        created_by = auth.uid() OR public.is_org_admin()
    )
);
