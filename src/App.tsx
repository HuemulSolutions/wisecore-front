import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { OrganizationProvider } from "./contexts/organization-context";
import { PermissionsProvider } from "./contexts/permissions-context";
import { ProtectedRoute } from "./components/auth/auth-protected-route";
import { ProtectedRoute as PermissionProtectedRoute } from "./components/auth/auth-protected-route-with-permissions";
import AppLayout from "./components/layout/app-layout";
import { HuemulAppLoading } from "./huemul/components/huemul-app-loading";
import Home from "./pages/home";
import { RootRedirect } from "./components/organization/root-redirect";

// Páginas cargadas de forma perezosa: cada una se descarga solo cuando el
// usuario navega a su ruta, en vez de entrar todas al bundle inicial.
const Templates = lazy(() => import("./pages/templates"));
const SearchPage = lazy(() => import("./pages/search"));
const Organizations = lazy(() => import("./pages/organizations"));
// import Library from "./pages/library"; // Hidden - library functionality disabled
const Assets = lazy(() => import("./pages/assets"));
const Graph = lazy(() => import("./pages/graph"));
const ModelsPage = lazy(() => import("./pages/models"));
const AuthTypes = lazy(() => import("./pages/auth-types"));
const UsersPage = lazy(() => import("./pages/users"));
const Roles = lazy(() => import("./pages/roles"));
const AssetTypesPage = lazy(() => import("./pages/assets-types"));
const CustomFieldsPage = lazy(() => import("./pages/custom-fields"));
const CanvasPage = lazy(() => import("./pages/canvas"));
const DiagramsPage = lazy(() => import("./pages/diagrams"));
const GlobalAdminPage = lazy(() => import("./pages/global-admin"));
const AdvancedPage = lazy(() => import("./pages/advanced"));
const ExternalSystemsPage = lazy(() => import("./pages/external-systems"));
const DocumentTypeRelationshipsPage = lazy(() => import("./pages/document-type-relationships"));
const MediaPage = lazy(() => import("./pages/media"));
const HuemulLayoutDemoPage = lazy(() => import("./pages/huemul-layout-demo"));
const WorkflowPage = lazy(() => import("./pages/workflow"));

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PermissionsProvider>
          <ProtectedRoute>
            <Suspense fallback={<HuemulAppLoading />}>
            <Routes>
          {/* Root redirect — sends user to /:orgId/home */}
          <Route path="/" element={<RootRedirect />} />

          {/* Non-org-scoped routes (no orgId needed) */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/huemul-demo" element={<HuemulLayoutDemoPage />} />
            <Route path="/global-admin" element={
              <PermissionProtectedRoute requireRootAdmin>
                <GlobalAdminPage />
              </PermissionProtectedRoute>
            } />
          </Route>

          {/* All org-scoped routes */}
          <Route path="/:orgId" element={<AppLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Navigate to="/home" replace />} />
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
            <Route path="global-admin" element={<Navigate to="/global-admin" replace />} />
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

            <Route path="canvas" element={
              <PermissionProtectedRoute permissions={["canvas:r", "canvas:l"]}>
                <CanvasPage />
              </PermissionProtectedRoute>
            } />

            <Route path="diagrams" element={
              <PermissionProtectedRoute permissions={["diagram:r", "diagram:l"]}>
                <DiagramsPage />
              </PermissionProtectedRoute>
            } />

            <Route path="advanced" element={
              <PermissionProtectedRoute permissions={["section_execution:r", "section_execution:l"]}>
                <Navigate to="home" replace />
              </PermissionProtectedRoute>
            } />
            <Route path="advanced/:section" element={
              <PermissionProtectedRoute permissions={["section_execution:r", "section_execution:l"]}>
                <AdvancedPage />
              </PermissionProtectedRoute>
            } />
            <Route path="external-systems" element={
              <PermissionProtectedRoute permissions={["external_system:r", "external_system:l"]}>
                <ExternalSystemsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="asset-type-relationships" element={
              <PermissionProtectedRoute permissions={["asset_type:r", "asset_type:l"]}>
                <DocumentTypeRelationshipsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="media" element={<MediaPage />} />
            <Route path="workflow" element={
              <PermissionProtectedRoute permissions={["asset:l"]}>
                <WorkflowPage />
              </PermissionProtectedRoute>
            } />
          </Route>

          {/* Catch-all: redirect unknown paths to root */}
          <Route path="*" element={<RootRedirect />} />
            </Routes>
            </Suspense>
        </ProtectedRoute>
        </PermissionsProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
