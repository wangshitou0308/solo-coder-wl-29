import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Feather,
  BarChart3,
  Camera,
  Download,
  Leaf,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/", icon: Home, label: "首页" },
  { to: "/journal", icon: BookOpen, label: "日记" },
  { to: "/species", icon: Feather, label: "图鉴" },
  { to: "/statistics", icon: BarChart3, label: "统计" },
  { to: "/equipment", icon: Camera, label: "装备" },
  { to: "/wishlist", icon: Star, label: "愿望" },
  { to: "/export", icon: Download, label: "导出" },
];

export default function Layout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-cream-100/95 backdrop-blur-md border-b border-cream-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-500 to-olive-700 flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-cream-100" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-earth-800 leading-tight">
                观鸟记录
              </h1>
              <p className="text-[10px] text-earth-500 leading-tight">Bird Journal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-full flex items-center gap-1.5 text-sm font-medium transition-all duration-200 min-h-[40px] ${
                    isActive
                      ? "bg-olive-700 text-white shadow-md"
                      : "text-earth-600 hover:bg-cream-200 hover:text-earth-800"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-4 pb-28 md:pb-6 animate-fade-in">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-cream-100/95 backdrop-blur-md border-t border-cream-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 flex-1 ${
                  isActive ? "text-olive-700" : "text-earth-400"
                }`
              }
            >
              <Icon className={`w-5 h-5 ${location.pathname.startsWith(to) && to !== "/" ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
