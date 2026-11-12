
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  ShieldAlert,
  FileBarChart,
  Settings,
  Bell,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ScanQrCode,
  ClipboardList,
   Mail,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
  {
  title: "MAIN MENU",
  items: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Visitors", path: "/visitors", icon: Users },
    { name: "Register Visitor", path: "/visitors/add", icon: UserPlus },
    { name: "Appointments", path: "/appointments", icon: CalendarDays },
    { name: "QR Scanner", path: "/qr-scanner", icon: ScanQrCode },
    
  ],
},
    {
      title: "MANAGEMENT",
      items: [
        { name: "Employees", path: "/employees", icon: Users, roles: ["admin"] },
        { name: "Blacklist", path: "/blacklist", icon: ShieldAlert, roles: ["admin"] },
        { name: "Reports", path: "/reports", icon: FileBarChart },
        { name: "Notifications", path: "/notifications", icon: Bell },
        { name: "Settings", path: "/settings", icon: Settings, roles: ["admin"] },
        {
  name: "Activity Logs",
  path: "/activity-logs",
  icon: ClipboardList,
  roles: ["admin"],
},
{
  name: "Email Logs",
  path: "/email-logs",
  icon: Mail,
  roles: ["admin"],
},
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <ShieldCheck size={25} />
        </div>

        <div>
          <h2>VisitPro</h2>
          <span>Visitor Management</span>
        </div>
      </div>

      <div className="sidebar-navigation">
        {navigation.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role)
          );

          return (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>

              {visibleItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={19} />
                    <span>{item.name}</span>
                    <ChevronRight size={15} className="sidebar-link-arrow" />
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "Employee"}</span>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
