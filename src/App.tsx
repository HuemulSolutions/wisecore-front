import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { OrganizationProvider } from "./contexts/organization-context";
import { PermissionsProvider } from "./contexts/permissions-context";
import { ProtectedRoute } from "./components/auth/auth-protected-route";
import { ProtectedRoute as PermissionProtectedRoute } from "./components/auth/auth-protected-route-with-permissions";
import AppLayout from "./components/layout/app-layout";
import Home from "./pages/home";
import Templates from "./pages/templates";
import DocumentPage from "./pages/document";
import SearchPage from "./pages/search";
import ConfigDocumentPage from "./pages/config_document";
import ExecutionPage from "./pages/execution"; 
import Organizations from "./pages/organizations";
// import Library from "./pages/library"; // Hidden - library functionality disabled
import Assets from "./pages/assets";
import Graph from "./pages/graph";
import ModelsPage from "./pages/models";
import AuthTypes from "./pages/auth-types";
import UsersPage from "./pages/users";
import Roles from "./pages/roles";
import AssetTypesPage from "./pages/assets-types";
import CustomFieldsPage from "./pages/custom-fields";
import GlobalAdminPage from "./pages/global-admin";
import { RootRedirect } from "./components/organization/root-redirect";

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PermissionsProvider>
          <ProtectedRoute>
            <Routes>
          {/* Root redirect — sends user to /:orgId/home */}
          <Route path="/" element={<RootRedirect />} />

          {/* All org-scoped routes */}
          <Route path="/:orgId" element={<AppLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="organizations" element={
              <PermissionProtectedRoute permissions={["organization:r", "organization:l"]}>
                <Organizations />
              </PermissionProtectedRoute>
            } />
            <Route path="templates" element={
              <PermissionProtectedRoute permissions={["template:r", "template:l"]}>
                <Templates />
              </PermissionProtectedRoute>
            } />
            <Route path="templates/:id" element={
              <PermissionProtectedRoute permissions={["template:r", "template:u"]}>
                <Templates />
              </PermissionProtectedRoute>
            } />
            <Route path="search" element={<SearchPage />} />
            <Route path="asset" element={
              <PermissionProtectedRoute permissions={["asset:r", "asset:l"]}>
                <Assets />
              </PermissionProtectedRoute>
            } />
            <Route path="asset/*" element={
              <PermissionProtectedRoute permissions={["asset:r", "asset:l"]}>
                <Assets />
              </PermissionProtectedRoute>
            } />
            <Route path="graph" element={<Graph />} />
            <Route path="models" element={
              <PermissionProtectedRoute permissions={["llm:r", "llm_provider:r"]}>
                <ModelsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="auth-types" element={
              <PermissionProtectedRoute permissions={["asset_type:r", "asset_type:l"]}>
                <AuthTypes />
              </PermissionProtectedRoute>
            } />
            <Route path="global-admin" element={
              <PermissionProtectedRoute requireRootAdmin>
                <GlobalAdminPage />
              </PermissionProtectedRoute>
            } />
            <Route path="users" element={
              <PermissionProtectedRoute permissions={["user:r", "user:l"]}>
                <UsersPage />
              </PermissionProtectedRoute>
            } />
            <Route path="roles" element={
              <PermissionProtectedRoute permissions={["rbac:r", "rbac:l"]}>
                <Roles />
              </PermissionProtectedRoute>
            } />
            <Route path="asset-types" element={
              <PermissionProtectedRoute permissions={["asset_type:r", "asset_type:l"]}>
                <AssetTypesPage />
              </PermissionProtectedRoute>
            } />
            <Route path="custom-fields" element={
              <PermissionProtectedRoute permissions={["asset_type:r", "asset_type:l"]}>
                <CustomFieldsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="document/:id" element={
              <PermissionProtectedRoute permissions={["section:r", "asset:r"]}>
                <DocumentPage />
              </PermissionProtectedRoute>
            } />
            <Route path="configDocument/:id" element={
              <PermissionProtectedRoute permissions={["section:u", "section:c"]}>
                <ConfigDocumentPage />
              </PermissionProtectedRoute>
            } />
            <Route path="execution/:id" element={
              <PermissionProtectedRoute permissions={["section_execution:r", "section_execution:c"]}>
                <ExecutionPage />
              </PermissionProtectedRoute>
            } />
          </Route>

          {/* Catch-all: redirect unknown paths to root */}
          <Route path="*" element={<RootRedirect />} />
            </Routes>
        </ProtectedRoute>
        </PermissionsProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
