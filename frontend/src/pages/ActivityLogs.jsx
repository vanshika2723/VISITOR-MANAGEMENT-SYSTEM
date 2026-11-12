
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  Activity,
} from "lucide-react";
import api from "../services/api";

const actionOptions = [
  "LOGIN",
  "LOGOUT",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "VISITOR_REGISTERED",
  "VISITOR_UPDATED",
  "VISITOR_DELETED",
  "VISITOR_APPROVED",
  "VISITOR_REJECTED",
  "VISITOR_CHECKED_IN",
  "VISITOR_CHECKED_OUT",
  "VISITOR_VERIFIED",
  "VISITOR_BLACKLISTED",
  "VISITOR_UNBLOCKED",
  "REPORT_EXPORTED",
  "PASSWORD_CHANGED",
  "OTHER",
];

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activity-logs", {
        params: {
          search,
          action,
          startDate,
          endDate,
          page,
          limit: 20,
        },
      });

      setActivities(response.data.activities || []);
      setPagination(
        response.data.pagination || { total: 0, totalPages: 0 }
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load activity logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, action, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchActivities();
  };

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionClass = (value) => {
    if (value?.includes("CHECKED_IN")) return "log-success";
    if (value?.includes("CHECKED_OUT")) return "log-info";
    if (value?.includes("REJECTED") || value?.includes("DELETED")) {
      return "log-danger";
    }
    if (value?.includes("APPROVED") || value?.includes("VERIFIED")) {
      return "log-success";
    }
    if (value?.includes("BLACKLISTED")) return "log-danger";
    return "log-default";
  };

  return (
    <div className="activity-logs-page">
      <div className="activity-page-header">
        <div>
          <div className="activity-title">
            <ShieldCheck size={27} />
            <h2>Security Audit Logs</h2>
          </div>
          <p>Monitor and track all important system activities.</p>
        </div>

        <button
          className="activity-refresh-button"
          onClick={fetchActivities}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="activity-stats-grid">
        <div className="activity-stat-card">
          <Activity size={23} />
          <div>
            <h3>{pagination.total || 0}</h3>
            <p>Total Activities</p>
          </div>
        </div>

        <div className="activity-stat-card">
          <Users size={23} />
          <div>
            <h3>{activities.length}</h3>
            <p>Activities on This Page</p>
          </div>
        </div>

        <div className="activity-stat-card">
          <Clock size={23} />
          <div>
            <h3>{pagination.totalPages || 0}</h3>
            <p>Total Pages</p>
          </div>
        </div>
      </div>

      <form className="activity-filter-card" onSubmit={handleSearch}>
        <div className="activity-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search description or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Actions</option>
          {actionOptions.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
        />

        <button type="submit" className="activity-search-button">
          Search
        </button>

        <button
          type="button"
          className="activity-reset-button"
          onClick={resetFilters}
        >
          Reset
        </button>
      </form>

      {error && <div className="activity-error">{error}</div>}

      <div className="activity-table-card">
        <div className="activity-table-heading">
          <h3>Activity History</h3>
          <span>{pagination.total || 0} Records</span>
        </div>

        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Performed By</th>
                <th>Visitor</th>
                <th>Description</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="activity-empty">
                    Loading activity logs...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="activity-empty">
                    No activity records found.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span
                        className={`activity-action-badge ${getActionClass(
                          item.action
                        )}`}
                      >
                        {item.action?.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td>
                      <div className="activity-user-cell">
                        <User size={16} />
                        <div>
                          <strong>
                            {item.performedByName ||
                              item.performedBy?.name ||
                              "System"}
                          </strong>
                          <small>{item.performedBy?.role || ""}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.visitor ? (
                        <div>
                          <strong>{item.visitor.name}</strong>
                          <small className="activity-subtext">
                            {item.visitor.visitorId}
                          </small>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="activity-description">
                      {item.description}
                    </td>

                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="activity-pagination">
          <span>
            Showing {activities.length} of {pagination.total || 0} records
          </span>

          <div>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => prev - 1)}
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <strong>
              {page} / {Math.max(1, pagination.totalPages || 1)}
            </strong>

            <button
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
