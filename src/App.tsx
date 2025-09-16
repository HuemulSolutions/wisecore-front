import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./pages/home";
import Templates from "./pages/templates";
import ConfigTemplate from "./pages/template";
import Documents from "./pages/documents";
import DocumentPage from "./pages/document";
import SearchPage from "./pages/search";
import ConfigDocumentPage from "./pages/config_document";
import ExecutionPage from "./pages/execution"; 
import DocDependPage from "./pages/doc_depend";
import Organizations from "./pages/organizations";
import Library from "./pages/library";
import Graph from "./pages/graph";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="templates" element={<Templates />} />
        <Route path="documents" element={<Documents />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="library" element={<Library />} />
        <Route path="graph" element={<Graph />} />
        <Route path="configTemplate/:id" element={<ConfigTemplate />} />
        <Route path="document/:id" element={<DocumentPage />} />
        <Route path="configDocument/:id" element={<ConfigDocumentPage />} />
        <Route path="execution/:id" element={<ExecutionPage />} />
        <Route path="docDepend/:id" element={<DocDependPage />} />
      </Route>
    </Routes>
  );
}