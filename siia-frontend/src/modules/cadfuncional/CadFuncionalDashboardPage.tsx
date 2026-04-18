import { Outlet } from "react-router-dom";

import { AppProviders } from "./src/providers/AppProviders";

export default function CadFuncionalDashboardPage() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
