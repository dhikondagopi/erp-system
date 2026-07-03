/**
 * permissions.js — Central Role-Based Access Control Configuration
 *
 * This file is the SINGLE SOURCE OF TRUTH for:
 *  1. Role definitions and hierarchy
 *  2. Navigation items (used by Sidebar)
 *  3. Permission matrix (what each role can do)
 *  4. Route access rules (used by ProtectedRoute + AppRoutes)
 *
 * To add a new feature: add it to NAV_GROUPS and ROUTE_PERMISSIONS here.
 * Sidebar visibility and route guards will update automatically.
 */

import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  Truck,
  DollarSign,
  ShoppingCart,
  Clipboard,
  Hammer,
  ClipboardList,
  History,
  BookOpen,
  Sparkles,
  FileText,
  Warehouse,
  ArrowLeftRight,
  Receipt,
  CreditCard,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROLE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN: 'Admin',
  BUSINESS_OWNER: 'Business Owner',
  SALES_USER: 'Sales User',
  PURCHASE_USER: 'Purchase User',
  MANUFACTURING_USER: 'Manufacturing User',
  INVENTORY_MANAGER: 'Inventory Manager',
};

/** All role values as an array — useful for dropdowns and iterations */
export const ALL_ROLES = Object.values(ROLES);

/** Role display metadata (label, color badge) */
export const ROLE_META = {
  [ROLES.ADMIN]: {
    label: 'Admin',
    color: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
  [ROLES.BUSINESS_OWNER]: {
    label: 'Business Owner',
    color: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    dot: 'bg-violet-400',
  },
  [ROLES.SALES_USER]: {
    label: 'Sales User',
    color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  [ROLES.PURCHASE_USER]: {
    label: 'Purchase User',
    color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
  },
  [ROLES.MANUFACTURING_USER]: {
    label: 'Manufacturing User',
    color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-400',
  },
  [ROLES.INVENTORY_MANAGER]: {
    label: 'Inventory Manager',
    color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    dot: 'bg-cyan-400',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. NAVIGATION GROUPS (Sidebar config with role filtering)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nav groups define Sidebar sections.
 * Each group has a label and an array of nav items.
 * Each nav item has: name, path, icon, roles (which roles can see it).
 *
 * Admin sees ALL items automatically — no need to list Admin in every roles array.
 */
export const NAV_GROUPS = [
  {
    groupLabel: 'Overview',
    items: [
      {
        key: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
      },
      {
        key: 'reports',
        name: 'Reports',
        path: '/reports',
        icon: FileText,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
      },
    ],
  },
  {
    groupLabel: 'AI Assistant',
    items: [
      {
        key: 'ai-copilot',
        name: 'AI Copilot',
        path: '/ai-copilot',
        icon: Sparkles,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.PURCHASE_USER,
          ROLES.MANUFACTURING_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
    ],
  },
  {
    groupLabel: 'Catalog & Stock',
    items: [
      {
        key: 'products',
        name: 'Products',
        path: '/products',
        icon: Package,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.PURCHASE_USER,
          ROLES.MANUFACTURING_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'inventory',
        name: 'Inventory',
        path: '/inventory',
        icon: Boxes,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.PURCHASE_USER,
          ROLES.MANUFACTURING_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'warehouses',
        name: 'Warehouses',
        path: '/warehouses',
        icon: Warehouse,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'transfers',
        name: 'Stock Transfers',
        path: '/transfers',
        icon: ArrowLeftRight,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'stock-ledger',
        name: 'Stock Ledger',
        path: '/inventory',  // Ledger is a tab within InventoryPage
        icon: BookOpen,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.INVENTORY_MANAGER,
        ],
        hidden: true, // Shown in sidebar only for Inventory Manager; page handled by InventoryPage tabs
      },
    ],
  },
  {
    groupLabel: 'CRM',
    items: [
      {
        key: 'customers',
        name: 'Customers',
        path: '/customers',
        icon: Users,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER],
      },
      {
        key: 'vendors',
        name: 'Vendors',
        path: '/vendors',
        icon: Truck,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER],
      },
    ],
  },
  {
    groupLabel: 'Commerce & Billing',
    items: [
      {
        key: 'sales-orders',
        name: 'Sales Orders',
        path: '/sales-orders',
        icon: DollarSign,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'purchase-orders',
        name: 'Purchase Orders',
        path: '/purchase-orders',
        icon: ShoppingCart,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.PURCHASE_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'invoices',
        name: 'Invoices',
        path: '/invoices',
        icon: Receipt,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.PURCHASE_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'payments',
        name: 'Payments',
        path: '/payments',
        icon: CreditCard,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.SALES_USER,
          ROLES.PURCHASE_USER,
        ],
      },
    ],
  },
  {
    groupLabel: 'Manufacturing',
    items: [
      {
        key: 'bom',
        name: 'Bill of Materials',
        path: '/bom',
        icon: Clipboard,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
      },
      {
        key: 'manufacturing-orders',
        name: 'Manufacturing Orders',
        path: '/manufacturing-orders',
        icon: Hammer,
        roles: [
          ROLES.ADMIN,
          ROLES.BUSINESS_OWNER,
          ROLES.MANUFACTURING_USER,
          ROLES.INVENTORY_MANAGER,
        ],
      },
      {
        key: 'work-orders',
        name: 'Work Orders',
        path: '/work-orders',
        icon: ClipboardList,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
      },
    ],
  },
  {
    groupLabel: 'System',
    items: [
      {
        key: 'audit-logs',
        name: 'Audit Logs',
        path: '/audit-logs',
        icon: History,
        roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fine-grained permission matrix mapping each role to allowed actions.
 */
export const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: {
    dashboard: ['read'],
    products: ['manage'],
    inventory: ['manage'],
    warehouses: ['manage'],
    transfers: ['manage'],
    invoices: ['manage'],
    payments: ['manage'],
    customers: ['manage'],
    vendors: ['manage'],
    sales_orders: ['manage'],
    purchase_orders: ['manage'],
    bom: ['manage'],
    manufacturing_orders: ['manage'],
    work_orders: ['manage'],
    audit_logs: ['read'],
    users: ['manage'],
    reports: ['read'],
  },

  [ROLES.BUSINESS_OWNER]: {
    dashboard: ['read'],
    products: ['read'],
    inventory: ['read'],
    warehouses: ['read'],
    transfers: ['read'],
    invoices: ['read'],
    payments: ['read'],
    customers: ['read'],
    vendors: ['read'],
    sales_orders: ['read'],
    purchase_orders: ['read'],
    bom: ['read'],
    manufacturing_orders: ['read'],
    work_orders: ['read'],
    audit_logs: ['read'],
    reports: ['read'],
  },

  [ROLES.SALES_USER]: {
    products: ['read'],
    inventory: ['read'],
    customers: ['manage'],
    sales_orders: ['manage'],
    invoices: ['manage'],
    payments: ['manage'],
  },

  [ROLES.PURCHASE_USER]: {
    products: ['read'],
    vendors: ['manage'],
    purchase_orders: ['manage'],
    invoices: ['manage'],
    payments: ['manage'],
  },

  [ROLES.MANUFACTURING_USER]: {
    products: ['read'],
    bom: ['manage'],
    manufacturing_orders: ['manage'],
    work_orders: ['manage'],
    inventory: ['read'],
  },

  [ROLES.INVENTORY_MANAGER]: {
    products: ['manage'],
    inventory: ['manage'],
    warehouses: ['manage'],
    transfers: ['manage'],
    sales_orders: ['read'],
    purchase_orders: ['read'],
    manufacturing_orders: ['read'],
    invoices: ['read'],
    payments: ['read'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROUTE ACCESS RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps each route path pattern to the array of roles that may access it.
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
  '/reports': [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
  '/ai-copilot': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.PURCHASE_USER,
    ROLES.MANUFACTURING_USER, ROLES.INVENTORY_MANAGER,
  ],

  '/products': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.PURCHASE_USER,
    ROLES.MANUFACTURING_USER, ROLES.INVENTORY_MANAGER,
  ],
  '/products/create': [ROLES.ADMIN, ROLES.INVENTORY_MANAGER],
  '/products/edit/:id': [ROLES.ADMIN, ROLES.INVENTORY_MANAGER],

  '/inventory': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.PURCHASE_USER,
    ROLES.MANUFACTURING_USER,
    ROLES.INVENTORY_MANAGER,
  ],

  '/warehouses': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER],
  '/transfers': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.INVENTORY_MANAGER],

  '/invoices': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.PURCHASE_USER,
    ROLES.INVENTORY_MANAGER,
  ],
  '/payments': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.PURCHASE_USER,
  ],

  '/customers': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.SALES_USER],
  '/customers/create': [ROLES.ADMIN, ROLES.SALES_USER],
  '/customers/edit/:id': [ROLES.ADMIN, ROLES.SALES_USER],

  '/vendors': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.PURCHASE_USER],
  '/vendors/create': [ROLES.ADMIN, ROLES.PURCHASE_USER],
  '/vendors/edit/:id': [ROLES.ADMIN, ROLES.PURCHASE_USER],

  '/sales-orders': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.INVENTORY_MANAGER,
  ],
  '/sales-orders/create': [ROLES.ADMIN, ROLES.SALES_USER],
  '/sales-orders/:id': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.SALES_USER, ROLES.INVENTORY_MANAGER,
  ],

  '/purchase-orders': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.PURCHASE_USER, ROLES.INVENTORY_MANAGER,
  ],
  '/purchase-orders/create': [ROLES.ADMIN, ROLES.PURCHASE_USER],
  '/purchase-orders/:id': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.PURCHASE_USER, ROLES.INVENTORY_MANAGER,
  ],

  '/bom': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],
  '/bom/create': [ROLES.ADMIN, ROLES.MANUFACTURING_USER],
  '/bom/edit/:id': [ROLES.ADMIN, ROLES.MANUFACTURING_USER],
  '/bom/:id': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],

  '/manufacturing-orders': [
    ROLES.ADMIN, ROLES.BUSINESS_OWNER,
    ROLES.MANUFACTURING_USER, ROLES.INVENTORY_MANAGER,
  ],

  '/work-orders': [ROLES.ADMIN, ROLES.BUSINESS_OWNER, ROLES.MANUFACTURING_USER],

  '/audit-logs': [ROLES.ADMIN, ROLES.BUSINESS_OWNER],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function can(role, module, action) {
  if (!role || !module || !action) return false;
  const perms = PERMISSION_MATRIX[role]?.[module] || [];
  return perms.includes('manage') || perms.includes(action);
}

export function getNavForRole(role) {
  if (!role) return [];
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.hidden && item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAllowedRolesForRoute(routeKey) {
  return ROUTE_PERMISSIONS[routeKey] || null;
}
