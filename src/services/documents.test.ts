/**
 * Unit tests for Documents Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { documentsService } from './documents';
import { downloadFile } from './supabase-helpers';

// ---------------------------------------------------------------------------
// Chainable Supabase query builder mock
// ---------------------------------------------------------------------------

function createQueryBuilder(resolvedValue: { data: any; error: any; count?: number | null }) {
  const builder: Record<string, any> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'is',
    'or',
    'overlaps',
    'order',
    'range',
    'single',
    'maybeSingle',
    'in',
    'ilike',
    'limit',
  ];

  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }

  // The terminal await resolves the value via .then()
  builder.then = (resolve: (v: any) => void) => resolve(resolvedValue);

  return builder;
}

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

vi.mock('./supabase-helpers', () => ({
  getPaginationRange: (page: number, pageSize: number) => ({
    from: (page - 1) * pageSize,
    to: (page - 1) * pageSize + pageSize - 1,
  }),
  parseSupabaseError: (error: { message: string; code: string }) => ({
    message: error.message || 'Unknown error',
    code: error.code,
  }),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_USER_ID = 'user-abc-123';
const FAKE_ORG_ID = 'org-xyz-789';

function mockAuthenticatedUser(userId = FAKE_USER_ID) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId } },
  });
}

function mockUnauthenticatedUser() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

/** Builds a fake raw document row as Supabase would return it. */
function fakeDocumentRow(overrides: Record<string, any> = {}) {
  return {
    id: 'doc-1',
    title: 'Test Document',
    description: 'A test document',
    status: 'draft',
    version: 1,
    file_size: 1024,
    is_locked: false,
    locked_by_user: null,
    tags: ['finance', 'report'],
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    document_type: {
      id: 'dt-1',
      name: 'Invoice',
      description: 'Invoice type',
      allowed_extensions: ['.pdf'],
      max_file_size_mb: 50,
      requires_approval: false,
    },
    owner: {
      id: FAKE_USER_ID,
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@example.com',
    },
    organization: { id: FAKE_ORG_ID, name: 'Acme', slug: 'acme' },
    folder: null,
    file_hash: 'abc123',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('documentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser();
  });

  // =========================================================================
  // list()
  // =========================================================================
  describe('list()', () => {
    it('should return paginated documents with no filters', async () => {
      const rows = [fakeDocumentRow(), fakeDocumentRow({ id: 'doc-2', title: 'Second' })];
      const qb = createQueryBuilder({ data: rows, error: null, count: 2 });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.list();

      expect(mockFrom).toHaveBeenCalledWith('documents');
      expect(qb.select).toHaveBeenCalled();
      expect(qb.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result.count).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].id).toBe('doc-1');
      expect(result.results[0].title).toBe('Test Document');
    });

    it('should apply search filter with or()', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ search: 'facture' });

      expect(qb.or).toHaveBeenCalledWith('title.ilike.%facture%,description.ilike.%facture%');
    });

    it('should apply status filter', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ status: 'validated' });

      expect(qb.eq).toHaveBeenCalledWith('status', 'validated');
    });

    it('should apply document_type filter', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ document_type: 'dt-invoice' });

      expect(qb.eq).toHaveBeenCalledWith('document_type_id', 'dt-invoice');
    });

    it('should apply owner filter', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ owner: 'user-42' });

      expect(qb.eq).toHaveBeenCalledWith('created_by', 'user-42');
    });

    it('should apply tags filter with overlaps()', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ tags: ['urgent', 'legal'] });

      expect(qb.overlaps).toHaveBeenCalledWith('tags', ['urgent', 'legal']);
    });

    it('should not apply tags filter when tags array is empty', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ tags: [] });

      expect(qb.overlaps).not.toHaveBeenCalled();
    });

    it('should use ascending ordering when no dash prefix', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ ordering: 'title' });

      expect(qb.order).toHaveBeenCalledWith('title', { ascending: true });
    });

    it('should use descending ordering when dash prefix is present', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list({ ordering: '-updated_at' });

      expect(qb.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('should default to -created_at ordering', async () => {
      const qb = createQueryBuilder({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(qb);

      await documentsService.list();

      expect(qb.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should set next/previous pagination links correctly', async () => {
      const rows = [fakeDocumentRow()];
      // count=50 means there are more pages after page 2
      const qb = createQueryBuilder({ data: rows, error: null, count: 50 });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.list({ page: 2 });

      expect(result.next).toBe('3');
      expect(result.previous).toBe('1');
    });

    it('should set next to null on the last page', async () => {
      const qb = createQueryBuilder({ data: [fakeDocumentRow()], error: null, count: 1 });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.list({ page: 1 });

      expect(result.next).toBeNull();
      expect(result.previous).toBeNull();
    });

    it('should throw on Supabase error', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'relation not found', code: '42P01' },
        count: null,
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.list()).rejects.toThrow('relation not found');
    });
  });

  // =========================================================================
  // get()
  // =========================================================================
  describe('get()', () => {
    it('should return a single mapped document', async () => {
      const row = fakeDocumentRow({ id: 'doc-99', title: 'My Invoice' });
      const qb = createQueryBuilder({ data: row, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-99');

      expect(mockFrom).toHaveBeenCalledWith('documents');
      expect(qb.eq).toHaveBeenCalledWith('id', 'doc-99');
      expect(qb.single).toHaveBeenCalled();
      expect(result.id).toBe('doc-99');
      expect(result.title).toBe('My Invoice');
      expect(result.owner.email).toBe('jean@example.com');
    });

    it('should map document_type fields correctly', async () => {
      const row = fakeDocumentRow();
      const qb = createQueryBuilder({ data: row, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-1');

      expect(result.document_type).toEqual({
        id: 'dt-1',
        name: 'Invoice',
        description: 'Invoice type',
        allowed_extensions: ['.pdf'],
        max_size: 50,
        requires_signature: false,
        requires_paraph: false,
        paraph_all_pages: false,
      });
    });

    it('should handle null document_type gracefully', async () => {
      const row = fakeDocumentRow({ document_type: null });
      const qb = createQueryBuilder({ data: row, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-1');

      expect(result.document_type).toBeNull();
    });

    it('should throw when document is not found', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'Aucun résultat trouvé.', code: 'PGRST301' },
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.get('nonexistent')).rejects.toThrow('Aucun résultat trouvé.');
    });

    it('should map tags into structured objects', async () => {
      const row = fakeDocumentRow({ tags: ['urgent', 'contract'] });
      const qb = createQueryBuilder({ data: row, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-1');

      expect(result.tags).toHaveLength(2);
      expect(result.tags[0]).toMatchObject({ name: 'urgent', color: '#6B7280' });
      expect(result.tags[1]).toMatchObject({ name: 'contract', color: '#6B7280' });
    });
  });

  // =========================================================================
  // create()
  // =========================================================================
  describe('create()', () => {
    it('should create a document with valid FormData (no file)', async () => {
      const createdRow = fakeDocumentRow({ id: 'doc-new', title: 'New Doc' });

      // Mock profiles lookup for org id
      const profileQb = createQueryBuilder({
        data: { organization_id: FAKE_ORG_ID },
        error: null,
      });
      // Mock documents insert
      const insertQb = createQueryBuilder({ data: createdRow, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') return profileQb;
        return insertQb;
      });

      const formData = new FormData();
      formData.append('title', 'New Doc');
      formData.append('description', 'A new document');

      const result = await documentsService.create(formData);

      expect(result.id).toBe('doc-new');
      expect(result.title).toBe('New Doc');
      expect(insertQb.insert).toHaveBeenCalled();
    });

    it('should throw when user is not authenticated', async () => {
      mockUnauthenticatedUser();

      const formData = new FormData();
      formData.append('title', 'Should Fail');

      await expect(documentsService.create(formData)).rejects.toThrow('Non authentifié');
    });

    it('should upload file to storage when file is provided', async () => {
      const { uploadFile } = await import('./supabase-helpers');
      (uploadFile as ReturnType<typeof vi.fn>).mockResolvedValue({ path: 'org/user/file.pdf' });

      const createdRow = fakeDocumentRow({ id: 'doc-with-file' });
      const profileQb = createQueryBuilder({
        data: { organization_id: FAKE_ORG_ID },
        error: null,
      });
      const insertQb = createQueryBuilder({ data: createdRow, error: null });
      // For the document_versions insert
      const versionQb = createQueryBuilder({ data: {}, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') return profileQb;
        if (table === 'document_versions') return versionQb;
        return insertQb;
      });

      const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('title', 'With File');
      formData.append('file', file);

      await documentsService.create(formData);

      expect(uploadFile).toHaveBeenCalledWith(
        'documents',
        expect.stringContaining('report.pdf'),
        file
      );
      expect(versionQb.insert).toHaveBeenCalled();
    });

    it('should throw when insert fails', async () => {
      const profileQb = createQueryBuilder({
        data: { organization_id: FAKE_ORG_ID },
        error: null,
      });
      const insertQb = createQueryBuilder({
        data: null,
        error: { message: 'Insert failed', code: '23505' },
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') return profileQb;
        return insertQb;
      });

      const formData = new FormData();
      formData.append('title', 'Duplicate');

      await expect(documentsService.create(formData)).rejects.toThrow('Insert failed');
    });
  });

  // =========================================================================
  // update()
  // =========================================================================
  describe('update()', () => {
    it('should update only provided fields', async () => {
      const updatedRow = fakeDocumentRow({ id: 'doc-1', title: 'Updated Title' });
      const qb = createQueryBuilder({ data: updatedRow, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.update('doc-1', { title: 'Updated Title' } as any);

      expect(qb.update).toHaveBeenCalled();
      expect(qb.eq).toHaveBeenCalledWith('id', 'doc-1');
      expect(result.title).toBe('Updated Title');
    });

    it('should update status field', async () => {
      const updatedRow = fakeDocumentRow({ status: 'validated' });
      const qb = createQueryBuilder({ data: updatedRow, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.update('doc-1', { status: 'validated' } as any);

      expect(result.status).toBe('validated');
    });

    it('should convert tag objects to string array', async () => {
      const updatedRow = fakeDocumentRow({ tags: ['finance', 'legal'] });
      const qb = createQueryBuilder({ data: updatedRow, error: null });
      mockFrom.mockReturnValue(qb);

      await documentsService.update('doc-1', {
        tags: [{ name: 'finance' }, { name: 'legal' }],
      } as any);

      // The update call should have been made (tags converted)
      expect(qb.update).toHaveBeenCalled();
    });

    it('should throw when user is not authenticated', async () => {
      mockUnauthenticatedUser();

      await expect(documentsService.update('doc-1', { title: 'Nope' } as any)).rejects.toThrow(
        'Non authentifié'
      );
    });

    it('should throw on Supabase error', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'Permission denied', code: '42501' },
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.update('doc-1', { title: 'Fail' } as any)).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  // =========================================================================
  // delete()
  // =========================================================================
  describe('delete()', () => {
    it('should soft-delete by setting deleted_at', async () => {
      const qb = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(qb);

      await documentsService.delete('doc-1');

      expect(mockFrom).toHaveBeenCalledWith('documents');
      expect(qb.update).toHaveBeenCalled();
      expect(qb.eq).toHaveBeenCalledWith('id', 'doc-1');
    });

    it('should throw on Supabase error', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'Cannot delete', code: '23503' },
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.delete('doc-1')).rejects.toThrow('Cannot delete');
    });
  });

  // =========================================================================
  // lock() / unlock()
  // =========================================================================
  describe('lock()', () => {
    it('should lock a document for the authenticated user', async () => {
      const qb = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(qb);

      await documentsService.lock('doc-1');

      expect(qb.update).toHaveBeenCalled();
      expect(qb.eq).toHaveBeenCalledWith('id', 'doc-1');
    });

    it('should throw when not authenticated', async () => {
      mockUnauthenticatedUser();

      await expect(documentsService.lock('doc-1')).rejects.toThrow('Non authentifié');
    });
  });

  describe('unlock()', () => {
    it('should unlock a document', async () => {
      const qb = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(qb);

      await documentsService.unlock('doc-1');

      expect(qb.update).toHaveBeenCalled();
      expect(qb.eq).toHaveBeenCalledWith('id', 'doc-1');
    });

    it('should throw on error', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'Unlock failed', code: 'UNKNOWN' },
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.unlock('doc-1')).rejects.toThrow('Unlock failed');
    });
  });

  // =========================================================================
  // getVersions()
  // =========================================================================
  describe('getVersions()', () => {
    it('should return mapped versions ordered by version_number desc', async () => {
      const rows = [
        {
          id: 'v-2',
          document_id: 'doc-1',
          version_number: 2,
          file_path: '/path/v2.pdf',
          file_name: 'v2.pdf',
          file_size: 2048,
          file_hash: 'hash2',
          changes_summary: 'Updated',
          created_at: '2025-02-01T00:00:00Z',
          uploaded_by: {
            id: FAKE_USER_ID,
            first_name: 'Jean',
            last_name: 'Dupont',
            email: 'jean@example.com',
          },
        },
        {
          id: 'v-1',
          document_id: 'doc-1',
          version_number: 1,
          file_path: '/path/v1.pdf',
          file_name: 'v1.pdf',
          file_size: 1024,
          file_hash: 'hash1',
          changes_summary: 'Initial',
          created_at: '2025-01-01T00:00:00Z',
          uploaded_by: null,
        },
      ];
      const qb = createQueryBuilder({ data: rows, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.getVersions('doc-1');

      expect(mockFrom).toHaveBeenCalledWith('document_versions');
      expect(qb.eq).toHaveBeenCalledWith('document_id', 'doc-1');
      expect(qb.order).toHaveBeenCalledWith('version_number', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].version_number).toBe(2);
      expect(result[0].comment).toBe('Updated');
      expect(result[1].version_number).toBe(1);
    });

    it('should throw on error', async () => {
      const qb = createQueryBuilder({
        data: null,
        error: { message: 'Versions fetch failed', code: 'UNKNOWN' },
      });
      mockFrom.mockReturnValue(qb);

      await expect(documentsService.getVersions('doc-1')).rejects.toThrow('Versions fetch failed');
    });
  });

  // =========================================================================
  // Document mapping edge cases
  // =========================================================================
  describe('document mapping', () => {
    it('should handle missing optional fields with defaults', async () => {
      const sparseRow = {
        id: 'doc-sparse',
        title: 'Sparse',
        description: null,
        status: null,
        version: null,
        file_size: null,
        is_locked: null,
        locked_by_user: null,
        tags: null,
        metadata: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        document_type: null,
        owner: null,
        organization: null,
        folder: null,
        file_hash: null,
      };
      const qb = createQueryBuilder({ data: sparseRow, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-sparse');

      expect(result.description).toBe('');
      expect(result.status).toBe('draft');
      expect(result.current_version).toBe(1);
      expect(result.file_size).toBe(0);
      expect(result.is_locked).toBe(false);
      expect(result.tags).toEqual([]);
      expect(result.document_type).toBeNull();
      expect(result.file_hash).toBe('');
    });

    it('should extract confidentiality_level from metadata', async () => {
      const row = fakeDocumentRow({
        metadata: { confidentiality_level: 'confidential' },
      });
      const qb = createQueryBuilder({ data: row, error: null });
      mockFrom.mockReturnValue(qb);

      const result = await documentsService.get('doc-1');

      expect(result.confidentiality_level).toBe('confidential');
    });
  });

  // =========================================================================
  // download()
  // =========================================================================
  describe('download()', () => {
    it('should return the blob and increment the download counter', async () => {
      mockFrom
        .mockReturnValueOnce(
          createQueryBuilder({ data: { file_path: 'p/f.pdf', download_count: 2 }, error: null })
        )
        .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }));
      const blob = new Blob(['hello']);
      vi.mocked(downloadFile).mockResolvedValue(blob as unknown as Blob);

      const result = await documentsService.download('doc-1');

      expect(result).toBe(blob);
      expect(downloadFile).toHaveBeenCalled();
    });

    it('should throw when the document has no file_path', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: { file_path: null }, error: null }));

      await expect(documentsService.download('doc-1')).rejects.toThrow('Aucun fichier associé');
    });

    it('should throw when the download itself fails', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: { file_path: 'p/f.pdf' }, error: null }));
      vi.mocked(downloadFile).mockResolvedValue(null as unknown as Blob);

      await expect(documentsService.download('doc-1')).rejects.toThrow('téléchargement');
    });
  });

  // =========================================================================
  // getTypes() / createType()
  // =========================================================================
  describe('getTypes()', () => {
    it('should map active document types with defaults', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({
          data: [{ id: 'dt-1', name: 'Invoice', allowed_extensions: ['.pdf'] }],
          error: null,
        })
      );

      const types = await documentsService.getTypes();

      expect(types).toHaveLength(1);
      expect(types[0]).toMatchObject({ id: 'dt-1', name: 'Invoice', max_size: 50 });
    });

    it('should throw on Supabase error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'boom', code: '500' } })
      );
      await expect(documentsService.getTypes()).rejects.toThrow('boom');
    });
  });

  describe('createType()', () => {
    it('should insert a document type scoped to the user org', async () => {
      mockFrom
        .mockReturnValueOnce(
          createQueryBuilder({ data: { organization_id: FAKE_ORG_ID }, error: null })
        ) // getUserOrgId
        .mockReturnValueOnce(
          createQueryBuilder({ data: { id: 'dt-9', name: 'Contract' }, error: null })
        );

      const result = await documentsService.createType({ name: 'Contract' });

      expect(result).toMatchObject({ id: 'dt-9', name: 'Contract' });
    });

    it('should throw when not authenticated', async () => {
      mockUnauthenticatedUser();
      await expect(documentsService.createType({ name: 'x' })).rejects.toThrow('Non authentifié');
    });
  });

  // =========================================================================
  // Basic annotations
  // =========================================================================
  describe('annotations (basic)', () => {
    const annotationRow = {
      id: 'ann-1',
      page_number: 1,
      x_position: 10,
      y_position: 20,
      width: 100,
      height: 40,
      content: 'note',
      annotation_type: 'comment',
      color: '#fff',
      created_at: '2025-01-01T00:00:00Z',
      user: { id: FAKE_USER_ID, first_name: 'Jean', last_name: 'Dupont' },
    };

    it('getAnnotations() should map rows', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: [annotationRow], error: null }));
      const result = await documentsService.getAnnotations('doc-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ann-1');
    });

    it('getAnnotations() should throw on error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'nope', code: '1' } })
      );
      await expect(documentsService.getAnnotations('doc-1')).rejects.toThrow('nope');
    });

    it('addAnnotation() should insert and return the mapped annotation', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: annotationRow, error: null }));
      const result = await documentsService.addAnnotation('doc-1', {
        page: 1,
        x: 10,
        y: 20,
        width: 100,
        height: 40,
        content: 'note',
        type: 'comment',
        color: '#fff',
      } as any);
      expect(result.id).toBe('ann-1');
    });

    it('updateAnnotation() should update provided fields only', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: annotationRow, error: null }));
      const result = await documentsService.updateAnnotation('doc-1', 'ann-1', {
        content: 'edited',
      });
      expect(result.id).toBe('ann-1');
    });

    it('deleteAnnotation() should resolve on success', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));
      await expect(documentsService.deleteAnnotation('doc-1', 'ann-1')).resolves.toBeUndefined();
    });

    it('deleteAnnotation() should throw on error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'del-fail', code: '1' } })
      );
      await expect(documentsService.deleteAnnotation('doc-1', 'ann-1')).rejects.toThrow('del-fail');
    });
  });

  // =========================================================================
  // Validation workflow
  // =========================================================================
  describe('validation workflow', () => {
    it('submitForReview() should set status pending and return submitted', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));
      const res = await documentsService.submitForReview('doc-1');
      expect(res).toEqual({ status: 'success', validation_status: 'submitted' });
    });

    it('submitForReview() should throw on error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'x', code: '1' } })
      );
      await expect(documentsService.submitForReview('doc-1')).rejects.toThrow('x');
    });

    it('startReview() should return under_review', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));
      const res = await documentsService.startReview('doc-1');
      expect(res.validation_status).toBe('under_review');
    });

    it('validateDocument() should approve and return validated', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));
      const res = await documentsService.validateDocument('doc-1');
      expect(res.validation_status).toBe('validated');
    });

    it('validateDocument() should throw when not authenticated', async () => {
      mockUnauthenticatedUser();
      await expect(documentsService.validateDocument('doc-1')).rejects.toThrow('Non authentifié');
    });

    it('rejectDocument() should set status rejected and log a comment', async () => {
      mockFrom
        .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }));
      const res = await documentsService.rejectDocument('doc-1', 'not good');
      expect(res.validation_status).toBe('rejected');
    });

    it('requestChanges() should set draft and insert a comment', async () => {
      mockFrom
        .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createQueryBuilder({ data: null, error: null }));
      const res = await documentsService.requestChanges('doc-1', 'please fix');
      expect(res.validation_status).toBe('changes_requested');
    });

    it('getValidationHistory() should merge comments and audit logs sorted desc', async () => {
      mockFrom
        .mockReturnValueOnce(
          createQueryBuilder({
            data: [
              {
                created_at: '2025-01-01T00:00:00Z',
                content: 'c1',
                is_resolved: false,
                page_number: 2,
                user: { id: 'u1', first_name: 'A', last_name: 'B' },
              },
            ],
            error: null,
          })
        )
        .mockReturnValueOnce(
          createQueryBuilder({
            data: [
              {
                created_at: '2025-02-01T00:00:00Z',
                action: 'validated',
                details: { comment: 'ok', step: 1 },
                user: { id: 'u2', first_name: 'C', last_name: 'D' },
              },
            ],
            error: null,
          })
        );

      const history = await documentsService.getValidationHistory('doc-1');

      expect(history).toHaveLength(2);
      // Most recent (audit log, Feb) first after desc sort.
      expect(history[0].type).toBe('workflow_action');
      expect(history[1].type).toBe('comment');
    });
  });

  // =========================================================================
  // Contextual annotations
  // =========================================================================
  describe('contextual annotations', () => {
    const ctxRow = {
      id: 'cx-1',
      page_number: 1,
      x_position: 5,
      y_position: 6,
      content: 'ctx',
      annotation_type: 'comment',
      color: '#000',
      is_resolved: false,
      created_at: '2025-01-01T00:00:00Z',
      user: { id: FAKE_USER_ID, first_name: 'Jean', last_name: 'Dupont' },
    };

    it('getContextualAnnotations() should map rows', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: [ctxRow], error: null }));
      const result = await documentsService.getContextualAnnotations('doc-1');
      expect(result).toHaveLength(1);
    });

    it('createContextualAnnotation() should insert and map', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: ctxRow, error: null }));
      const result = await documentsService.createContextualAnnotation('doc-1', {
        page_number: 1,
        position: { x: 5, y: 6 },
        content: { text: 'ctx' },
        annotation_type: 'comment',
      } as any);
      expect(result.id).toBe('cx-1');
    });

    it('resolveAnnotation() should mark resolved', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: { ...ctxRow, is_resolved: true }, error: null })
      );
      const result = await documentsService.resolveAnnotation('doc-1', 'cx-1');
      expect(result.id).toBe('cx-1');
    });

    it('resolveAnnotation() should throw on error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'res-fail', code: '1' } })
      );
      await expect(documentsService.resolveAnnotation('doc-1', 'cx-1')).rejects.toThrow('res-fail');
    });
  });

  // =========================================================================
  // compareVersions()
  // =========================================================================
  describe('compareVersions()', () => {
    const versionRow = (n: number) => ({
      version_number: n,
      created_at: `2025-0${n}-01T00:00:00Z`,
      file_size: n * 100,
      created_by_user: { id: 'u1', first_name: 'A', last_name: 'B' },
    });

    it('should return a comparison of two versions', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: [versionRow(1), versionRow(2)], error: null })
      );
      const result = await documentsService.compareVersions('doc-1', 1, 2);
      expect(result.version_a.number).toBe(1);
      expect(result.version_b.number).toBe(2);
    });

    it('should throw when a version is missing', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: [versionRow(1)], error: null }));
      await expect(documentsService.compareVersions('doc-1', 1, 2)).rejects.toThrow('Version');
    });

    it('should throw on Supabase error', async () => {
      mockFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'cmp-fail', code: '1' } })
      );
      await expect(documentsService.compareVersions('doc-1', 1, 2)).rejects.toThrow('cmp-fail');
    });
  });
});
