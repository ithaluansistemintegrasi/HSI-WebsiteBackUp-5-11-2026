import { Routes, Route } from "react-router-dom";
import RequireAdmin from "./RequireAdmin";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";

import AdminDashboard from "./pages/AdminDashboard";
import AdminBanners from "./pages/AdminBanners";
import AdminProducts from "./pages/AdminProducts";
import AdminNews from "./pages/AdminNews";
import AdminEvents from "./pages/AdminEvents";
import AdminSpareParts from "./pages/AdminSpareParts";
import AdminPartners from "./pages/AdminPartners";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="spareparts" element={<AdminSpareParts />} />
          <Route path="partners" element={<AdminPartners />} />
        </Route>
      </Route>
    </Routes>
  );
}
