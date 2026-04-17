import { Outlet } from "react-router-dom";

import { AppProviders } from "./src/providers/AppProviders";

export default function ReabilitaDashboardPage() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
