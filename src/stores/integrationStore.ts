/**
 * Integration Store - State management for external integrations
 * Supports Microsoft 365, Google Workspace, Sage, SAP, and Salesforce
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  integrationService,
  salesforceService,
  type IntegrationConnection,
  type IntegrationConnectionDetail,
  type IntegrationSyncLog,
  type IntegrationDocumentMapping,
  type IntegrationSyncMapping,
  type IntegrationWorkflowTrigger,
  type SalesforceConnection,
  type IntegrationProvider,
  type CloudFolder,
} from '../services/integrations';

interface IntegrationState {
  // Connections
  connections: IntegrationConnection[];
  selectedConnection: IntegrationConnectionDetail | null;
  salesforceConnection: SalesforceConnection | null;

  // Mappings
  documentMappings: IntegrationDocumentMapping[];
  syncMappings: IntegrationSyncMapping[];
  workflowTriggers: IntegrationWorkflowTrigger[];

  // Sync logs
  syncLogs: IntegrationSyncLog[];

  // Cloud folder browser
  currentFolders: CloudFolder[];
  folderBreadcrumb: Array<{ id: string; name: string }>;

  // UI state
  isLoading: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchConnections: () => Promise<void>;
  fetchConnection: (id: string) => Promise<void>;
  createConnection: (provider: IntegrationProvider, name: string) => Promise<IntegrationConnection>;
  deleteConnection: (id: string) => Promise<void>;

  // OAuth flow
  startOAuthFlow: (id: string, redirectUri: string) => Promise<string>;
  completeOAuthFlow: (
    id: string,
    code: string,
    state: string,
    redirectUri: string
  ) => Promise<void>;

  // Credentials auth
  connectWithCredentials: (
    id: string,
    credentials: {
      api_url: string;
      username: string;
      password: string;
      company_code?: string;
    }
  ) => Promise<boolean>;

  // Connection actions
  disconnect: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>;
  syncNow: (id: string, fullSync?: boolean) => Promise<void>;

  // Folder browsing
  browseFolders: (connectionId: string, parentId?: string) => Promise<void>;
  navigateToFolder: (folder: CloudFolder) => void;
  navigateUp: () => void;

  // Mappings
  fetchDocumentMappings: () => Promise<void>;
  createDocumentMapping: (mapping: Partial<IntegrationDocumentMapping>) => Promise<void>;
  deleteDocumentMapping: (id: string) => Promise<void>;

  fetchSyncMappings: () => Promise<void>;
  createSyncMapping: (mapping: Partial<IntegrationSyncMapping>) => Promise<void>;
  deleteSyncMapping: (id: string) => Promise<void>;
  triggerSyncMapping: (id: string) => Promise<void>;

  // Workflow triggers
  fetchWorkflowTriggers: () => Promise<void>;
  createWorkflowTrigger: (trigger: Partial<IntegrationWorkflowTrigger>) => Promise<void>;
  deleteWorkflowTrigger: (id: string) => Promise<void>;

  // Sync logs
  fetchSyncLogs: (connectionId?: string) => Promise<void>;

  // Salesforce specific
  fetchSalesforceConnection: () => Promise<void>;
  startSalesforceOAuth: (redirectUri: string, isSandbox?: boolean) => Promise<string>;
  completeSalesforceOAuth: (code: string, state: string, redirectUri: string) => Promise<void>;

  // Clear state
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  connections: [],
  selectedConnection: null,
  salesforceConnection: null,
  documentMappings: [],
  syncMappings: [],
  workflowTriggers: [],
  syncLogs: [],
  currentFolders: [],
  folderBreadcrumb: [],
  isLoading: false,
  isConnecting: false,
  isSyncing: false,
  error: null,
};

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Fetch all connections
      fetchConnections: async () => {
        set({ isLoading: true, error: null });
        try {
          const connections = await integrationService.getConnections();
          set({ connections, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Fetch single connection with details
      fetchConnection: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const connection = await integrationService.getConnection(id);
          set({ selectedConnection: connection, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Create new connection
      createConnection: async (provider: IntegrationProvider, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const connection = await integrationService.createConnection({ provider, name });
          set((state) => ({
            connections: [...state.connections, connection],
            isLoading: false,
          }));
          return connection;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      // Delete connection
      deleteConnection: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await integrationService.deleteConnection(id);
          set((state) => ({
            connections: state.connections.filter((c) => c.id !== id),
            selectedConnection:
              state.selectedConnection?.id === id ? null : state.selectedConnection,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Start OAuth flow
      startOAuthFlow: async (id: string, redirectUri: string) => {
        set({ isConnecting: true, error: null });
        try {
          const { authorization_url } = await integrationService.getAuthorizationUrl(
            id,
            redirectUri
          );
          return authorization_url;
        } catch (error) {
          set({ error: (error as Error).message, isConnecting: false });
          throw error;
        }
      },

      // Complete OAuth flow
      completeOAuthFlow: async (id: string, code: string, state: string, redirectUri: string) => {
        set({ isConnecting: true, error: null });
        try {
          await integrationService.handleOAuthCallback(id, code, state, redirectUri);
          // Refresh connection
          await get().fetchConnection(id);
          await get().fetchConnections();
          set({ isConnecting: false });
        } catch (error) {
          set({ error: (error as Error).message, isConnecting: false });
          throw error;
        }
      },

      // Connect with credentials
      connectWithCredentials: async (id: string, credentials) => {
        set({ isConnecting: true, error: null });
        try {
          const result = await integrationService.connectWithCredentials(id, credentials);
          if (result.success) {
            await get().fetchConnection(id);
            await get().fetchConnections();
          }
          set({ isConnecting: false });
          return result.success;
        } catch (error) {
          set({ error: (error as Error).message, isConnecting: false });
          return false;
        }
      },

      // Disconnect
      disconnect: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await integrationService.disconnect(id);
          await get().fetchConnections();
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Test connection
      testConnection: async (id: string) => {
        try {
          return await integrationService.testConnection(id);
        } catch (error) {
          return { success: false, message: (error as Error).message };
        }
      },

      // Sync now
      syncNow: async (id: string, fullSync = false) => {
        set({ isSyncing: true, error: null });
        try {
          await integrationService.syncNow(id, fullSync);
          set({ isSyncing: false });
        } catch (error) {
          set({ error: (error as Error).message, isSyncing: false });
        }
      },

      // Browse folders
      browseFolders: async (connectionId: string, parentId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const { folders } = await integrationService.listFolders(connectionId, parentId);
          set({ currentFolders: folders, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      navigateToFolder: (folder: CloudFolder) => {
        set((state) => ({
          folderBreadcrumb: [...state.folderBreadcrumb, { id: folder.id, name: folder.name }],
        }));
      },

      navigateUp: () => {
        set((state) => ({
          folderBreadcrumb: state.folderBreadcrumb.slice(0, -1),
        }));
      },

      // Document mappings
      fetchDocumentMappings: async () => {
        try {
          const mappings = await integrationService.getDocumentMappings();
          set({ documentMappings: mappings });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      createDocumentMapping: async (mapping) => {
        try {
          const created = await integrationService.createDocumentMapping(mapping);
          set((state) => ({ documentMappings: [...state.documentMappings, created] }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteDocumentMapping: async (id: string) => {
        try {
          await integrationService.deleteDocumentMapping(id);
          set((state) => ({ documentMappings: state.documentMappings.filter((m) => m.id !== id) }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      // Sync mappings
      fetchSyncMappings: async () => {
        try {
          const mappings = await integrationService.getSyncMappings();
          set({ syncMappings: mappings });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      createSyncMapping: async (mapping) => {
        try {
          const created = await integrationService.createSyncMapping(mapping);
          set((state) => ({ syncMappings: [...state.syncMappings, created] }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteSyncMapping: async (id: string) => {
        try {
          await integrationService.deleteSyncMapping(id);
          set((state) => ({ syncMappings: state.syncMappings.filter((m) => m.id !== id) }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      triggerSyncMapping: async (id: string) => {
        set({ isSyncing: true });
        try {
          await integrationService.triggerSyncMapping(id);
          set({ isSyncing: false });
        } catch (error) {
          set({ error: (error as Error).message, isSyncing: false });
        }
      },

      // Workflow triggers
      fetchWorkflowTriggers: async () => {
        try {
          const triggers = await integrationService.getWorkflowTriggers();
          set({ workflowTriggers: triggers });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      createWorkflowTrigger: async (trigger) => {
        try {
          const created = await integrationService.createWorkflowTrigger(trigger);
          set((state) => ({ workflowTriggers: [...state.workflowTriggers, created] }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteWorkflowTrigger: async (id: string) => {
        try {
          await integrationService.deleteWorkflowTrigger(id);
          set((state) => ({ workflowTriggers: state.workflowTriggers.filter((t) => t.id !== id) }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      // Sync logs
      fetchSyncLogs: async (connectionId?: string) => {
        try {
          const logs = await integrationService.getSyncLogs(connectionId);
          set({ syncLogs: logs });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      // Salesforce specific
      fetchSalesforceConnection: async () => {
        try {
          const connection = await salesforceService.getConnection();
          set({ salesforceConnection: connection });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      startSalesforceOAuth: async (redirectUri: string, isSandbox = false) => {
        set({ isConnecting: true, error: null });
        try {
          const { authorization_url } = await salesforceService.getAuthorizationUrl(
            redirectUri,
            isSandbox
          );
          return authorization_url;
        } catch (error) {
          set({ error: (error as Error).message, isConnecting: false });
          throw error;
        }
      },

      completeSalesforceOAuth: async (code: string, state: string, redirectUri: string) => {
        set({ isConnecting: true, error: null });
        try {
          await salesforceService.handleOAuthCallback(code, state, redirectUri);
          await get().fetchSalesforceConnection();
          set({ isConnecting: false });
        } catch (error) {
          set({ error: (error as Error).message, isConnecting: false });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset store
      reset: () => set(initialState),
    }),
    {
      name: 'advist-integrations',
      partialize: (state) => ({
        // Only persist non-sensitive data
        folderBreadcrumb: state.folderBreadcrumb,
      }),
    }
  )
);

export default useIntegrationStore;
