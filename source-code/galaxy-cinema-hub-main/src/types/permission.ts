// Types for Permission Management
export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  module: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  created_at: string;
}

export interface PermissionsResponse {
  success: boolean;
  data: {
    permissions: Permission[];
    grouped: Record<string, Permission[]>;
    modules: string[];
  };
}

export interface RolePermissionsResponse {
  success: boolean;
  data: {
    role: Role;
    permissions: Permission[];
    grouped: Record<string, Permission[]>;
    total: number;
  };
}

export interface CreatePermissionData {
  name: string;
  display_name: string;
  description?: string;
  module: string;
}

export interface UpdatePermissionData {
  display_name?: string;
  description?: string;
  module?: string;
}

export interface AssignPermissionData {
  permission_id: number;
}

export interface SyncPermissionsData {
  permission_ids: number[];
}
