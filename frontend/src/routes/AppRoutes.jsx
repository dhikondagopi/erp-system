import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout Imports
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// Central Permissions Config
import { ROUTE_PERMISSIONS as RP } from '../config/permissions';

import LandingPage from '../features/auth/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ProductsPage from '../features/products/pages/ProductsPage';
import CreateProductPage from '../features/products/pages/CreateProductPage';
import EditProductPage from '../features/products/pages/EditProductPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import WarehouseHubPage from '../features/inventory/pages/WarehouseHubPage';
import TransfersPage from '../features/inventory/pages/TransfersPage';
import CustomersPage from '../features/customers/pages/CustomersPage';
import CreateCustomerPage from '../features/customers/pages/CreateCustomerPage';
import EditCustomerPage from '../features/customers/pages/EditCustomerPage';
import VendorsPage from '../features/vendors/pages/VendorsPage';
import CreateVendorPage from '../features/vendors/pages/CreateVendorPage';
import EditVendorPage from '../features/vendors/pages/EditVendorPage';
import SalesPage from '../features/sales/pages/SalesPage';
import CreateSalesOrderPage from '../features/sales/pages/CreateSalesOrderPage';
import SalesOrderDetailsPage from '../features/sales/pages/SalesOrderDetailsPage';
import PurchasePage from '../features/purchase/pages/PurchasePage';
import CreatePurchaseOrderPage from '../features/purchase/pages/CreatePurchaseOrderPage';
import PurchaseOrderDetailsPage from '../features/purchase/pages/PurchaseOrderDetailsPage';
import InvoiceHubPage from '../features/sales/pages/InvoiceHubPage';
import PaymentsPage from '../features/sales/pages/PaymentsPage';
import BomPage from '../features/bom/pages/BomPage';
import CreateBomPage from '../features/bom/pages/CreateBomPage';
import EditBomPage from '../features/bom/pages/EditBomPage';
import BomDetailsPage from '../features/bom/pages/BomDetailsPage';
import ManufacturingPage from '../features/manufacturing/pages/ManufacturingPage';
import WorkOrdersPage from '../features/work-orders/pages/WorkOrdersPage';
import AuditPage from '../features/audit/pages/AuditPage';
import AiCopilotPage from '../features/ai-copilot/pages/AiCopilotPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import UnauthorizedPage from '../features/unauthorized/pages/UnauthorizedPage';
import NotFoundPage from '../features/not-found/pages/NotFoundPage';

const withRole = (permissionKey, element) => (
  <ProtectedRoute allowedRoles={RP[permissionKey]}>
    {element}
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<SignupPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected app shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={withRole('/dashboard', <DashboardPage />)}
        />

        {/* Reports */}
        <Route
          path="reports"
          element={withRole('/reports', <ReportsPage />)}
        />

        {/* AI Copilot */}
        <Route
          path="ai-copilot"
          element={withRole('/ai-copilot', <AiCopilotPage />)}
        />

        {/* Product Catalog */}
        <Route
          path="products"
          element={withRole('/products', <ProductsPage />)}
        />
        <Route
          path="products/create"
          element={withRole('/products/create', <CreateProductPage />)}
        />
        <Route
          path="products/edit/:id"
          element={withRole('/products/edit/:id', <EditProductPage />)}
        />

        {/* Inventory & Warehouses */}
        <Route
          path="inventory"
          element={withRole('/inventory', <InventoryPage />)}
        />
        <Route
          path="warehouses"
          element={withRole('/warehouses', <WarehouseHubPage />)}
        />
        <Route
          path="transfers"
          element={withRole('/transfers', <TransfersPage />)}
        />

        {/* Customers */}
        <Route
          path="customers"
          element={withRole('/customers', <CustomersPage />)}
        />
        <Route
          path="customers/create"
          element={withRole('/customers/create', <CreateCustomerPage />)}
        />
        <Route
          path="customers/edit/:id"
          element={withRole('/customers/edit/:id', <EditCustomerPage />)}
        />

        {/* Vendors */}
        <Route
          path="vendors"
          element={withRole('/vendors', <VendorsPage />)}
        />
        <Route
          path="vendors/create"
          element={withRole('/vendors/create', <CreateVendorPage />)}
        />
        <Route
          path="vendors/edit/:id"
          element={withRole('/vendors/edit/:id', <EditVendorPage />)}
        />

        {/* Commerce, Invoices & Payments */}
        <Route
          path="sales-orders"
          element={withRole('/sales-orders', <SalesPage />)}
        />
        <Route
          path="sales-orders/create"
          element={withRole('/sales-orders/create', <CreateSalesOrderPage />)}
        />
        <Route
          path="sales-orders/:id"
          element={withRole('/sales-orders/:id', <SalesOrderDetailsPage />)}
        />

        <Route
          path="purchase-orders"
          element={withRole('/purchase-orders', <PurchasePage />)}
        />
        <Route
          path="purchase-orders/create"
          element={withRole('/purchase-orders/create', <CreatePurchaseOrderPage />)}
        />
        <Route
          path="purchase-orders/:id"
          element={withRole('/purchase-orders/:id', <PurchaseOrderDetailsPage />)}
        />

        <Route
          path="invoices"
          element={withRole('/invoices', <InvoiceHubPage />)}
        />
        <Route
          path="payments"
          element={withRole('/payments', <PaymentsPage />)}
        />

        {/* Bill of Materials */}
        <Route
          path="bom"
          element={withRole('/bom', <BomPage />)}
        />
        <Route
          path="bom/create"
          element={withRole('/bom/create', <CreateBomPage />)}
        />
        <Route
          path="bom/edit/:id"
          element={withRole('/bom/edit/:id', <EditBomPage />)}
        />
        <Route
          path="bom/:id"
          element={withRole('/bom/:id', <BomDetailsPage />)}
        />

        {/* Manufacturing */}
        <Route
          path="manufacturing-orders"
          element={withRole('/manufacturing-orders', <ManufacturingPage />)}
        />

        {/* Work Orders */}
        <Route
          path="work-orders"
          element={withRole('/work-orders', <WorkOrdersPage />)}
        />

        {/* Audit Logs */}
        <Route
          path="audit-logs"
          element={withRole('/audit-logs', <AuditPage />)}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;