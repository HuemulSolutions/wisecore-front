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
import { RBAC_PAGES } from "./lib/rbac-matrix";

// Páginas cargadas de forma perezosa: cada una se descarga solo cuando el
// usuario navega a su ruta, en vez de entrar todas al bundle inicial.
const Templates = lazy(() => import("./pages/templates"));
const SearchPage = lazy(() => import("./pages/search"));
const Organizations = lazy(() => import("./pages/organizations"));
// import Library from "./pages/library"; // Hidden - library functionality disabled
const Assets = lazy(() => import("./pages/assets"));
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
const WorkflowPage = lazy(() => import("./pages/workflow"));
const TokenUsagePage = lazy(() => import("./pages/token-usage"));

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
            <Route path="/global-admin" element={
              <PermissionProtectedRoute requireRootAdmin={RBAC_PAGES["global-admin"].requireRootAdmin} showErrorPage>
                <GlobalAdminPage />
              </PermissionProtectedRoute>
            } />
          </Route>

          {/* All org-scoped routes */}
          <Route path="/:orgId" element={<AppLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Navigate to="/home" replace />} />
            <Route path="organizations" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.organizations.routePermissions]}>
                <Organizations />
              </PermissionProtectedRoute>
            } />
            <Route path="templates" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.templates.routePermissions]}>
                <Templates />
              </PermissionProtectedRoute>
            } />
            <Route path="templates/:id" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.templates.routePermissions]}>
                <Templates />
              </PermissionProtectedRoute>
            } />
            <Route path="search" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.search.routePermissions]}>
                <SearchPage />
              </PermissionProtectedRoute>
            } />
            <Route path="asset" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.asset.routePermissions]}>
                <Assets />
              </PermissionProtectedRoute>
            } />
            <Route path="asset/*" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.asset.routePermissions]}>
                <Assets />
              </PermissionProtectedRoute>
            } />
            <Route path="models" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.models.routePermissions]}>
                <ModelsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="auth-types" element={
              <PermissionProtectedRoute requireRootAdmin={RBAC_PAGES["auth-types"].requireRootAdmin} showErrorPage>
                <AuthTypes />
              </PermissionProtectedRoute>
            } />
            <Route path="global-admin" element={<Navigate to="/global-admin" replace />} />
            <Route path="users" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.users.routePermissions]}>
                <UsersPage />
              </PermissionProtectedRoute>
            } />
            <Route path="roles" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.roles.routePermissions]}>
                <Roles />
              </PermissionProtectedRoute>
            } />
            <Route path="asset-types" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES["asset-types"].routePermissions]}>
                <AssetTypesPage />
              </PermissionProtectedRoute>
            } />
            <Route path="custom-fields" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES["custom-fields"].routePermissions]}>
                <CustomFieldsPage />
              </PermissionProtectedRoute>
            } />

            <Route path="canvas" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.canvas.routePermissions]}>
                <CanvasPage />
              </PermissionProtectedRoute>
            } />

            <Route path="diagrams" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.diagrams.routePermissions]}>
                <DiagramsPage />
              </PermissionProtectedRoute>
            } />

            <Route path="advanced" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.advanced.routePermissions]}>
                <Navigate to="home" replace />
              </PermissionProtectedRoute>
            } />
            <Route path="advanced/:section" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.advanced.routePermissions]}>
                <AdvancedPage />
              </PermissionProtectedRoute>
            } />
            <Route path="external-systems" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES["external-systems"].routePermissions]}>
                <ExternalSystemsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="asset-type-relationships" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES["asset-type-relationships"].routePermissions]}>
                <DocumentTypeRelationshipsPage />
              </PermissionProtectedRoute>
            } />
            <Route path="media" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.media.routePermissions]}>
                <MediaPage />
              </PermissionProtectedRoute>
            } />
            <Route path="token-usage" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES["token-usage"].routePermissions]}>
                <TokenUsagePage />
              </PermissionProtectedRoute>
            } />
            <Route path="workflow" element={
              <PermissionProtectedRoute permissions={[...RBAC_PAGES.workflow.routePermissions]}>
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
