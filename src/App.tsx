import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./pages/home";
import Documents from "./pages/documents";
import Generate from "./pages/generate";
import SearchPage from "./pages/search";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="documents" element={<Documents />} />
        <Route path="generate" element={<Generate />} />
        <Route path="search" element={<SearchPage />} />

      </Route>
    </Routes>
  );
}