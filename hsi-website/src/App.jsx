import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import AdminApp from "./admin/AdminApp";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./sections/Home";
import News from "./sections/News";
import NewsDetail from "./sections/NewsDetail";
import TentangKami from "./sections/TentangKami";
import Upevent from "./sections/Upevent";
import Sparepart from "./sections/Sparepart";
import ProductDetail from "./sections/ProductDetail";

function ScrollToSection() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (pathname !== "/") return;

    const params = new URLSearchParams(search);
    const id = params.get("section");
    if (!id) return;

    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;

      const headerOffset = window.innerWidth < 768 ? 64 : 80;
      const y =
        el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
      window.history.replaceState({}, "", "/");
    }, 120);

    return () => clearTimeout(t);
  }, [pathname, search]);

  return null;
}

function ScrollToTopOnRoute() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("section")) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function PublicLayout() {
  return (
    <div className="min-h-screen">
      <ScrollToTopOnRoute />
      <ScrollToSection />
      <Navbar />

      <main className="pt-16 md:pt-20">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ADMIN (semua /admin/... ditangani AdminApp) */}
      <Route path="/admin/*" element={<AdminApp />} />

      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sparepart" element={<Sparepart />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route path="/tentang-kami" element={<TentangKami />} />
        <Route path="/upevent" element={<Upevent />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
      </Route>
    </Routes>
  );
}
