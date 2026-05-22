import React, { useState } from "react";
import DashboardHeader from "@/component/DashboardHeader";
import DashboardLeftSide from "@/pages/Dashboard/DashboardLeftSide";

export default function MainLayout({ children, user, contentClassName = "" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <DashboardLeftSide mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className={`app-main ${contentClassName}`}>{children}</main>
      </div>
    </div>
  );
}
