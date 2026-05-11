import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShowcasesPage } from "@/pages/ShowcasesPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/showcases" replace />} />
          <Route path="showcases" element={<ShowcasesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}