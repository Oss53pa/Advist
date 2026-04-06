-- ============================================
-- Storage Buckets (replaces Django MEDIA_ROOT)
-- ============================================

-- Documents bucket (PDFs, Office files, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/gif'
    ]
) ON CONFLICT (id) DO NOTHING;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- public for display
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Signatures bucket (signature images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signatures',
    'signatures',
    false,
    2097152, -- 2MB
    ARRAY['image/png', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Organization logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'org-assets',
    'org-assets',
    true,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS Policies
-- ============================================

-- Documents: org members can read, uploaders can write
DROP POLICY IF EXISTS "documents_bucket_select" ON storage.objects;
CREATE POLICY "documents_bucket_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id::text = (storage.foldername(name))[1]
        )
    )
);

DROP POLICY IF EXISTS "documents_bucket_insert" ON storage.objects;
CREATE POLICY "documents_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id::text = (storage.foldername(name))[1]
        )
    )
);

DROP POLICY IF EXISTS "documents_bucket_delete" ON storage.objects;
CREATE POLICY "documents_bucket_delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'documents' AND (
        auth.uid()::text = (storage.foldername(name))[2]
        OR public.is_org_admin()
    )
);

-- Avatars: anyone can read, users can update their own
DROP POLICY IF EXISTS "avatars_bucket_select" ON storage.objects;
CREATE POLICY "avatars_bucket_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'avatars'
);

DROP POLICY IF EXISTS "avatars_bucket_insert" ON storage.objects;
CREATE POLICY "avatars_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "avatars_bucket_update" ON storage.objects;
CREATE POLICY "avatars_bucket_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Signatures: user sees own only
DROP POLICY IF EXISTS "signatures_bucket_select" ON storage.objects;
CREATE POLICY "signatures_bucket_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "signatures_bucket_insert" ON storage.objects;
CREATE POLICY "signatures_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Org assets: org members read, admins write
DROP POLICY IF EXISTS "org_assets_bucket_select" ON storage.objects;
CREATE POLICY "org_assets_bucket_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'org-assets'
);

DROP POLICY IF EXISTS "org_assets_bucket_insert" ON storage.objects;
CREATE POLICY "org_assets_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'org-assets' AND public.is_org_admin()
);
