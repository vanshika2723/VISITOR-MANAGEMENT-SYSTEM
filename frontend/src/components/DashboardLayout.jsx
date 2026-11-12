
import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <Header />

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
