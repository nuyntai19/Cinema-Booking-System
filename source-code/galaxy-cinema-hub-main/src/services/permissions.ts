import { apiCall, API_BASE_URL } from '@/lib/api';
import type {
  Permission,
  PermissionsResponse,
  RolePermissionsResponse,
  CreatePermissionData,
  UpdatePermissionData,
  AssignPermissionData,
  SyncPermissionsData,
} from '@/types/permission';

const PERMISSIONS_BASE = `${API_BASE_URL}/api/permissions`;
const ROLES_BASE = `${API_BASE_URL}/api/roles`;

export const permissionsService = {
  // Get all permissions
  getAllPermissions: async (filters?: { module?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.module) params.append('module', filters.module);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString();
    const url = query ? `${PERMISSIONS_BASE}?${query}` : PERMISSIONS_BASE;
    
    return await apiCall<PermissionsResponse>(url);
  },

  // Create permission
  createPermission: async (data: CreatePermissionData) => {
    return await apiCall<{ success: boolean; data: { permission: Permission } }>(
      PERMISSIONS_BASE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Update permission
  updatePermission: async (id: number, data: UpdatePermissionData) => {
    return await apiCall<{ success: boolean; data: { permission: Permission } }>(
      `${PERMISSIONS_BASE}/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Delete permission
  deletePermission: async (id: number) => {
    return await apiCall<{ success: boolean }>(
      `${PERMISSIONS_BASE}/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Get role permissions
  getRolePermissions: async (roleId: number) => {
    return await apiCall<RolePermissionsResponse>(
      `${ROLES_BASE}/${roleId}/permissions`
    );
  },

  // Assign permission to role
  assignPermission: async (roleId: number, data: AssignPermissionData) => {
    return await apiCall<{ success: boolean; data: { message: string } }>(
      `${ROLES_BASE}/${roleId}/permissions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Revoke permission from role
  revokePermission: async (roleId: number, permissionId: number) => {
    return await apiCall<{ success: boolean; data: { message: string } }>(
      `${ROLES_BASE}/${roleId}/permissions/${permissionId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Sync all permissions for role
  syncPermissions: async (roleId: number, data: SyncPermissionsData) => {
    return await apiCall<RolePermissionsResponse>(
      `${ROLES_BASE}/${roleId}/permissions/sync`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },
};

