import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./pages/home";
import Templates from "./pages/templates";
import ConfigTemplate from "./pages/template";
import Documents from "./pages/documents";
import DocumentPage from "./pages/document";
import Generate from "./pages/generate";
import SearchPage from "./pages/search";
import ConfigDocumentPage from "./pages/config_document";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="templates" element={<Templates />} />
        <Route path="documents" element={<Documents />} />
        <Route path="generate" element={<Generate />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="configTemplate/:id" element={<ConfigTemplate />} />
        <Route path="document/:id" element={<DocumentPage />} />
        <Route path="configDocument/:id" element={<ConfigDocumentPage />} />
      </Route>
    </Routes>
  );
}