import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "./api";
import useIdleLogout from "./useIdleLogout";

const linkBase =
  "block px-3 py-2 rounded-lg text-sm transition border border-transparent";
const linkActive = "bg-slate-900 text-white";
const linkIdle = "text-slate-700 hover:bg-slate-100";

export default function AdminLayout() {
  const nav = useNavigate();

  function logout() {
    clearToken();
    nav("/admin/login", { replace: true });
  }

  useIdleLogout();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              HSI Admin
            </div>
          </div>

          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-red-700 border border-slate-200 hover:bg-red-500 text-sm text-white"
          >
            Logout
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          <aside className="bg-white border border-slate-200 rounded-2xl p-3 h-fit">
            <nav className="grid gap-1">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/admin/banners"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Banner (Season Greeting)
              </NavLink>

              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Produk
              </NavLink>

              <NavLink
                to="/admin/news"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Blog Artikel
              </NavLink>

              <NavLink
                to="/admin/events"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Event
              </NavLink>
              <NavLink
                to="/admin/spareparts"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkIdle}`
                }
              >
                Spareparts
              </NavLink>
            </nav>
          </aside>

          <main className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
