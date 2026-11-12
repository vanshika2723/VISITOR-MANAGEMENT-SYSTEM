
import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { socket } = useAuth();

  const fetchDashboard = async () => {
    try {
      setError("");

      const response = await api.get("/dashboard/stats");

      const data = response.data;

      setStats(data.stats || data.data?.stats || data);
      setRecentVisitors(
        data.recentVisitors || data.data?.recentVisitors || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);
// ===============================
// REAL-TIME DASHBOARD UPDATES
// ===============================
useEffect(() => {
  if (!socket) return;

  const handleVisitorUpdate = () => {
    console.log("Refreshing dashboard with latest visitor data...");
    fetchDashboard();
  };

  socket.on("visitorUpdated", handleVisitorUpdate);

  return () => {
    socket.off("visitorUpdated", handleVisitorUpdate);
  };
}, [socket]);
  const cards = [
    {
      title: "Total Visitors",
      value: stats?.totalVisitors ?? 0,
      icon: Users,
      color: "#f47721",
      background: "#fff0e5",
    },
    {
      title: "Today's Visitors",
      value: stats?.todayVisitors ?? 0,
      icon: CalendarDays,
      color: "#4779d9",
      background: "#edf3ff",
    },
    {
      title: "Currently Inside",
      value: stats?.checkedInVisitors ?? 0,
      icon: UserCheck,
      color: "#269b70",
      background: "#e8f7f0",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingVisitors ?? 0,
      icon: Clock,
      color: "#d49a27",
      background: "#fff7e5",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Monitor visitors and office entry activity.</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchDashboard}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
          <button onClick={fetchDashboard}>Try Again</button>
        </div>
      )}

      <div className="dashboard-stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="stat-card" key={card.title}>
              <div className="stat-card-top">
                <div>
                  <p>{card.title}</p>
                  <h3>{card.value}</h3>
                </div>

                <div
                  className="stat-icon"
                  style={{
                    color: card.color,
                    background: card.background,
                  }}
                >
                  <Icon size={23} />
                </div>
              </div>

              <div className="stat-card-bottom">
                <span>Live system data</span>
                <ArrowUpRight size={15} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-table-card">
        <div className="dashboard-table-header">
          <div>
            <h3>Recent Visitors</h3>
            <p>Latest visitor registrations</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Company</th>
                <th>Host</th>
                <th>Visit Status</th>
                <th>Approval</th>
              </tr>
            </thead>

            <tbody>
              {recentVisitors.length > 0 ? (
                recentVisitors.map((visitor) => (
                  <tr key={visitor._id}>
                    <td>
                      <div className="visitor-table-name">
                        <div className="visitor-table-avatar">
                          {visitor.name?.charAt(0)?.toUpperCase() || "V"}
                        </div>

                        <div>
                          <strong>{visitor.name}</strong>
                          <span>{visitor.visitorId}</span>
                        </div>
                      </div>
                    </td>

                    <td>{visitor.company || "—"}</td>

                    <td>{visitor.host?.name || "—"}</td>

                    <td>
                      <span className={`status-badge ${visitor.visitStatus}`}>
                        {visitor.visitStatus}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge ${visitor.approvalStatus}`}>
                        {visitor.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table">
                    No visitors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
