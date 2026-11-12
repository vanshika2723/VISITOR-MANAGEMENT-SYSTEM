
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  CheckCircle2,
  Clock3,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/email-logs";

const EMAIL_TYPES = [
  ["visitor_registration", "Visitor Registration"],
  ["appointment_confirmation", "Appointment Confirmation"],
  ["approval", "Approval"],
  ["rejection", "Rejection"],
  ["checkin", "Check-in"],
  ["checkout", "Check-out"],
  ["appointment_reminder", "Appointment Reminder"],
  ["password_reset", "Password Reset"],
  ["system", "System"],
];

const formatLabel = (value = "") =>
  EMAIL_TYPES.find(([key]) => key === value)?.[1] ||
  value.replaceAll("_", " ");

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const StatusBadge = ({ status }) => {
  const styles = {
    sent: "email-status sent",
    failed: "email-status failed",
    pending: "email-status pending",
  };

  return (
    <span className={styles[status] || "email-status"}>
      {status || "unknown"}
    </span>
  );
};

const EmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0,
    sent: 0,
    failed: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [emailType, setEmailType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("visitor_token");

      const response = await axios.get(API_URL, {
        params: {
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          emailType: emailType || undefined,
          startDate: startDate || undefined,
endDate: endDate || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setLogs(data.emailLogs || []);
      setSummary(data.summary || { pending: 0, sent: 0, failed: 0 });
      setTotal(data.total || 0);
      setPages(Math.max(1, data.pages || 1));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load email logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, emailType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

const clearFilters = () => {
  setSearch("");
  setStatus("");
  setEmailType("");
  setStartDate("");
  setEndDate("");
  setPage(1);
};
const exportCSV = async () => {
  try {
    const token = sessionStorage.getItem("visitor_token");

    const response = await axios.get(API_URL, {
      params: {
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        status: status || undefined,
        emailType: emailType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const rows = response.data.emailLogs || [];

    if (!rows.length) {
      alert("Export karne ke liye koi email record nahi mila.");
      return;
    }

    const columns = [
      "Recipient",
      "Subject",
      "Email Type",
      "Status",
      "Created At",
      "Sent At",
      "Attempts",
      "Error",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvRows = [
      columns,
      ...rows.map((log) => [
        log.recipient,
        log.subject,
        log.emailType,
        log.status,
        log.createdAt,
        log.sentAt || "",
        log.attempts ?? 0,
        log.errorMessage || "",
      ]),
    ];

    const csvContent =
      "\uFEFF" + csvRows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visitpro-email-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "CSV export failed. Please try again."
    );
  }
};

  const openLogDetails = async (log) => {
    setSelectedLog({ ...log, detailsLoading: true });

    try {
      const token = sessionStorage.getItem("visitor_token");
      const response = await axios.get(`${API_URL}/${log._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedLog(response.data.emailLog);
    } catch (err) {
      setSelectedLog({
        ...log,
        detailsError:
          err.response?.data?.message || "Could not load email details.",
      });
    }
  };

  const statCards = [
    {
      title: "Total Emails",
      value: total,
      icon: Mail,
      color: "orange",
    },
    {
      title: "Successfully Sent",
      value: summary.sent,
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Pending",
      value: summary.pending,
      icon: Clock3,
      color: "blue",
    },
    {
      title: "Failed",
      value: summary.failed,
      icon: XCircle,
      color: "red",
    },
  ];

  return (
    <div className="email-logs-page">
      <div className="email-logs-heading">
        <div>
          <span className="email-logs-eyebrow">COMMUNICATION CENTER</span>
          <h1>Email Logs</h1>
          <p>Monitor email delivery, notifications and delivery errors.</p>
        </div>

        <button
          type="button"
          className="email-refresh-btn"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "email-spinning" : ""} />
          Refresh
        </button>
      </div>

      <div className="email-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="email-stat-card" key={card.title}>
              <div className={`email-stat-icon ${card.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p>{card.title}</p>
                <h2>{card.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <section className="email-logs-panel">
        <div className="email-panel-heading">
          <div>
            <h2>Email Delivery History</h2>
            <p>{total} email records found</p>
          </div>
        </div>

        <div className="email-filters">
          <div className="email-search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search recipient or subject..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by delivery status"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={emailType}
            onChange={(event) => {
              setEmailType(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by email type"
          >
            <option value="">All email types</option>
            {EMAIL_TYPES.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
<input
  type="date"
  aria-label="Start date"
  value={startDate}
  max={endDate || undefined}
  onChange={(event) => {
    setStartDate(event.target.value);
    setPage(1);
  }}
/>

<input
  type="date"
  aria-label="End date"
  value={endDate}
  min={startDate || undefined}
  onChange={(event) => {
    setEndDate(event.target.value);
    setPage(1);
  }}
/>

<button
  type="button"
  className="email-export-btn"
  onClick={exportCSV}
>
  Export CSV
</button>
          <button
            type="button"
            className="email-clear-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="email-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={fetchLogs}>
              Retry
            </button>
          </div>
        )}

        <div className="email-table-wrap">
          <table className="email-table">
            <thead>
              <tr>
                <th>RECIPIENT</th>
                <th>SUBJECT</th>
                <th>EMAIL TYPE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="email-table-message">
                    <span className="email-inline-spinner" />
                    Loading email records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="email-table-message">
                    No email records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div className="email-recipient">
                        <span className="email-recipient-icon">
                          <Mail size={16} />
                        </span>
                        <span>{log.recipient}</span>
                      </div>
                    </td>
                    <td>
                      <span className="email-subject" title={log.subject}>
                        {log.subject}
                      </span>
                    </td>
                    <td>{formatLabel(log.emailType)}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="email-view-btn"
                        title="View email details"
                        aria-label={`View email to ${log.recipient}`}
                        onClick={() => openLogDetails(log)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="email-pagination">
          <span>
            Page {page} of {pages} · {total} records
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {selectedLog && (
        <div
          className="email-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLog(null);
          }}
        >
          <section
            className="email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-modal-title"
          >
            <div className="email-modal-header">
              <div>
                <span className="email-logs-eyebrow">EMAIL RECORD</span>
                <h2 id="email-modal-title">Email Details</h2>
              </div>
              <button
                type="button"
                className="email-modal-close"
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
              >
                <X size={21} />
              </button>
            </div>

            {selectedLog.detailsLoading ? (
              <p className="email-modal-message">Loading details...</p>
            ) : selectedLog.detailsError ? (
              <p className="email-error">{selectedLog.detailsError}</p>
            ) : (
              <div className="email-modal-body">
                <div className="email-detail-row">
                  <span>Recipient</span>
                  <strong>{selectedLog.recipient}</strong>
                </div>
                <div className="email-detail-row">
                  <span>Subject</span>
                  <strong>{selectedLog.subject}</strong>
                </div>
                <div className="email-detail-row">
                  <span>Type</span>
                  <strong>{formatLabel(selectedLog.emailType)}</strong>
                </div>
                <div className="email-detail-row">
                  <span>Status</span>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div className="email-detail-row">
                  <span>Created</span>
                  <strong>{formatDate(selectedLog.createdAt)}</strong>
                </div>
                <div className="email-detail-row">
                  <span>Sent at</span>
                  <strong>{formatDate(selectedLog.sentAt)}</strong>
                </div>
                <div className="email-detail-row">
                  <span>Attempts</span>
                  <strong>{selectedLog.attempts ?? 0}</strong>
                </div>

                {selectedLog.visitor && (
                  <div className="email-detail-row">
                    <span>Visitor</span>
                    <strong>
                      {selectedLog.visitor.name || "Visitor"}
                      {selectedLog.visitor.visitorId
                        ? ` (${selectedLog.visitor.visitorId})`
                        : ""}
                    </strong>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div className="email-error-detail">
                    <strong>Delivery Error</strong>
                    <p>{selectedLog.errorMessage}</p>
                  </div>
                )}

                {selectedLog.message && (
                  <div className="email-message-detail">
                    <strong>Email Message</strong>
                    <pre>{selectedLog.message}</pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;
