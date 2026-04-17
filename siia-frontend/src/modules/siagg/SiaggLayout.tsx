import { NavLink, Outlet } from "react-router-dom";
import "./SiaggDashboardPage.css";

const menuItems = [
  { to: "/dashboard/siagg", label: "Painel" },
  { to: "/dashboard/siagg/relatorios", label: "Relatorios" },
  { to: "/dashboard/siagg/governanca", label: "Governanca" },
  { to: "/dashboard/siagg/pncp", label: "PNCP" },
];

export default function SiaggLayout() {
  return (
    <section className="siagg-home">
      <nav className="siagg-module-nav" aria-label="Navegacao do modulo SIAGG">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard/siagg"}
            className={({ isActive }) =>
              isActive ? "siagg-module-nav-link siagg-module-nav-link--active" : "siagg-module-nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}
