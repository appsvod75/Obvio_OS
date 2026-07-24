import type { Role } from '../types';

export const PERMISSIONS = {
  'pos:access': 'Acceder al POS',
  'pos:discount': 'Aplicar descuentos',
  'pos:refund': 'Reembolsar ventas',
  'reception:manage': 'Gestionar recepción',
  'agenda:manage': 'Gestionar agenda',
  'catalog:read': 'Ver catálogo',
  'catalog:create': 'Crear items',
  'catalog:update': 'Editar items',
  'catalog:delete': 'Eliminar items',
  'clients:read': 'Ver clientes',
  'clients:create': 'Crear clientes',
  'clients:update': 'Editar clientes',
  'clients:delete': 'Eliminar clientes',
  'inventory:read': 'Ver inventario',
  'inventory:create': 'Crear movimientos',
  'inventory:update': 'Editar inventario',
  'staff:read': 'Ver personal',
  'staff:create': 'Crear personal',
  'staff:update': 'Editar personal',
  'staff:delete': 'Eliminar personal',
  'cash:open_close': 'Abrir/cerrar caja',
  'cash:read': 'Ver cortes de caja',
  'reports:view': 'Ver reportes',
  'settings:view': 'Ver configuración',
  'settings:update': 'Modificar configuración',
  'promotions:crud': 'Gestionar promociones',
  'branches:manage': 'Gestionar sucursales',
  'display:manage': 'Gestionar pantalla TV',
  'sales:read': 'Ver ventas',
  'sales:delete': 'Eliminar ventas',
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

const ROLE_BASELINE: Record<Role, Permission[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: [
    'pos:access', 'pos:discount',
    'reception:manage', 'agenda:manage',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete',
    'clients:read', 'clients:create', 'clients:update', 'clients:delete',
    'inventory:read', 'inventory:create', 'inventory:update',
    'staff:read',
    'cash:open_close', 'cash:read',
    'reports:view',
    'settings:view', 'settings:update',
    'promotions:crud',
    'branches:manage',
    'display:manage',
    'sales:read',
  ],
  reception: [
    'reception:manage',
    'agenda:manage',
    'clients:read', 'clients:create',
    'sales:read',
  ],
  barber: [
    'agenda:manage',
    'clients:read',
    'sales:read',
  ],
  cashier: [
    'pos:access',
    'reception:manage',
    'clients:read', 'clients:create',
    'cash:open_close', 'cash:read',
    'sales:read',
  ],
  ventas_caja: [
    'pos:access', 'pos:discount',
    'reception:manage',
    'clients:read', 'clients:create',
    'cash:open_close', 'cash:read',
    'sales:read',
  ],
  display: [],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_BASELINE[role] || [];
}

export function hasPermission(
  role: Role,
  overrides: { grant?: string[]; deny?: string[] } | undefined,
  permission: Permission
): boolean {
  if (overrides?.deny?.includes(permission)) return false;
  if (overrides?.grant?.includes(permission)) return true;
  return ROLE_BASELINE[role]?.includes(permission) || false;
}

export function getEffectivePermissions(
  role: Role,
  overrides?: { grant?: string[]; deny?: string[] }
): Permission[] {
  if (role === 'superadmin') return ALL_PERMISSIONS;
  const base = ROLE_BASELINE[role] || [];
  const grantSet = new Set(overrides?.grant || []);
  const denySet = new Set(overrides?.deny || []);
  const merged = [...new Set([...base, ...grantSet])].filter(p => !denySet.has(p));
  return merged as Permission[];
}

export { ALL_PERMISSIONS as ALL_PERMISSIONS_LIST, ROLE_BASELINE };
