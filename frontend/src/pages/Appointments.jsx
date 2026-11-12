
import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Search,
  Clock,
  UserRound,
  Building2,
  RefreshCw,
  CalendarCheck,
  Check,
  X,
  
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import { Pencil } from "lucide-react";

export default function Appointments() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");const [rescheduleVisitor, setRescheduleVisitor] = useState(null);
const [newAppointmentDate, setNewAppointmentDate] = useState("");
const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/visitors");
      const data = response.data;
      const records = data.visitors || data.data?.visitors || data.data || [];

      setVisitors(
        (Array.isArray(records) ? records : []).filter(
          (visitor) => visitor.appointmentDate
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load appointments. Please check your login."
      );
    } finally {
      setLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState("");

  const handleAppointmentAction = async (visitor, action) => {
    const actionLabel = action === "approve" ? "approve" : "reject";
let rejectionReason = "";

if (action === "reject") {
  rejectionReason = window.prompt(
    `Enter rejection reason for ${visitor.name}:`
  );

  if (rejectionReason === null) return;

  if (!rejectionReason.trim()) {
    alert("Rejection reason is required.");
    return;
  }
}
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} the appointment for ${visitor.name}?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(`${visitor._id}-${action}`);
const response = await api.patch(
  `/visitor-workflow/${visitor._id}/${action}`,
  action === "reject" ? { rejectionReason } : {}
);

      alert(response.data.message || `Appointment ${actionLabel}d successfully.`);
      await fetchAppointments();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          `Unable to ${actionLabel} this appointment.`
      );
    } finally {
      setActionLoading("");
    }
  };

const handleReschedule = async (e) => {
  e.preventDefault();

  if (!rescheduleVisitor || !newAppointmentDate) {
    alert("Please select a new appointment date and time.");
    return;
  }

  const selectedDate = new Date(newAppointmentDate);

  if (Number.isNaN(selectedDate.getTime())) {
    alert("Please select a valid appointment date.");
    return;
  }

  try {
    setRescheduleLoading(true);

    const response = await api.put(
      `/visitors/${rescheduleVisitor._id}`,
      { appointmentDate: selectedDate.toISOString() }
    );

    alert(response.data.message || "Appointment rescheduled successfully.");
    setRescheduleVisitor(null);
    setNewAppointmentDate("");
    await fetchAppointments();
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Unable to reschedule appointment."
    );
  } finally {
    setRescheduleLoading(false);
  }
};

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getStatus = (visitor) =>
  visitor.approvalStatus || "pending";

  const filteredAppointments = visitors.filter((visitor) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      visitor.name,
      visitor.company,
      visitor.host?.name,
      visitor.purpose,
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" || getStatus(visitor) === statusFilter;

    const appointmentDate = visitor.appointmentDate
      ? new Date(visitor.appointmentDate).toISOString().slice(0, 10)
      : "";

    const matchesDate =
      !dateFilter || appointmentDate === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (value) => {
    if (!value) return "Not scheduled";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const statusClass = (status) =>
    `appointment-status appointment-${String(status)
      .toLowerCase()
      .replace(/[^a-z]/g, "")}`;

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div>
          <p className="appointments-eyebrow">VISITPRO MANAGEMENT</p>
          <h1>Appointments</h1>
          <p className="appointments-subtitle">
            Manage and track scheduled visitor appointments.
          </p>
        </div>

        <button
          className="appointments-refresh"
          onClick={fetchAppointments}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="appointments-summary">
        <div className="appointment-summary-card">
          <div className="appointment-summary-icon">
            <CalendarDays size={22} />
          </div>
          <div>
            <p>Total Appointments</p>
            <h2>{visitors.length}</h2>
          </div>
        </div>

        <div className="appointment-summary-card">
          <div className="appointment-summary-icon pending-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Pending</p>
            <h2>
              {visitors.filter((v) => getStatus(v) === "pending").length}
            </h2>
          </div>
        </div>

        <div className="appointment-summary-card">
          <div className="appointment-summary-icon approved-icon">
            <CalendarCheck size={22} />
          </div>
          <div>
            <p>Approved</p>
            <h2>
              {visitors.filter((v) => getStatus(v) === "approved").length}
            </h2>
          </div>
        </div>
      </div>

      <div className="appointments-content">
        <div className="appointments-toolbar">
          <div className="appointments-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor, company, host..."
            />
          </div>

          <input
            className="appointment-date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by appointment date"
          />

          <select
            className="appointment-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="appointments-message">Loading appointments...</div>
        ) : error ? (
          <div className="appointments-message appointments-error">
            {error}
            <button onClick={fetchAppointments}>Try again</button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="appointments-empty">
            <CalendarDays size={42} />
            <h3>No appointments found</h3>
            <p>
              Register a visitor with an appointment date, or change your
              search and filters.
            </p>
          </div>
        ) : (
          <div className="appointments-table-wrap">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Company</th>
                  <th>Host</th>
                  <th>Purpose</th>
                  <th>Appointment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map((visitor) => (
                  <tr key={visitor._id}>
                    <td>
                      <div className="appointment-visitor">
                        <div className="appointment-avatar">
                          {visitor.name?.charAt(0)?.toUpperCase() || "V"}
                        </div>
                        <div>
                          <strong>{visitor.name || "Unknown Visitor"}</strong>
                          <small>{visitor.email || visitor.phone || "—"}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <Building2 size={15} className="appointment-inline-icon" />
                      {visitor.company || "—"}
                    </td>

                    <td>
                      <UserRound size={15} className="appointment-inline-icon" />
                      {visitor.host?.name || visitor.hostName || "—"}
                    </td>

                    <td>{visitor.purpose || "—"}</td>
                    <td>{formatDate(visitor.appointmentDate)}</td>

                    <td>
                      <span className={statusClass(getStatus(visitor))}>
                        {getStatus(visitor)}
                      </span>
                    </td>
                    
<td>
  {getStatus(visitor) === "pending" ? (
    <div className="appointment-actions">
      <button
        className="appointment-approve-btn"
        title="Approve appointment"
        disabled={Boolean(actionLoading)}
        onClick={() => handleAppointmentAction(visitor, "approve")}
      >
        {actionLoading === `${visitor._id}-approve` ? (
          <LoaderCircle size={15} className="spin" />
        ) : (
          <Check size={15} />
        )}
        Approve
      </button>

      <button
        className="appointment-reject-btn"
        title="Reject appointment"
        disabled={Boolean(actionLoading)}
        onClick={() => handleAppointmentAction(visitor, "reject")}
      >
        {actionLoading === `${visitor._id}-reject` ? (
          <LoaderCircle size={15} className="spin" />
        ) : (
          <X size={15} />
        )}
        Reject
      </button>
      <button
  className="appointment-reschedule-btn"
  title="Reschedule appointment"
  onClick={() => {
    setRescheduleVisitor(visitor);
    setNewAppointmentDate(
      visitor.appointmentDate
        ? (() => {
            const date = new Date(visitor.appointmentDate);
            const localDate = new Date(
              date.getTime() - date.getTimezoneOffset() * 60000
            );
            return localDate.toISOString().slice(0, 16);
          })()
        : ""
    );
  }}
>
  <Pencil size={14} />
  Reschedule
</button>
    </div>
  ) : (
    <span className="appointment-action-complete">No actions</span>
  )}
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
{rescheduleVisitor && (
  <div className="appointment-modal-backdrop">
    <form
      className="appointment-modal"
      onSubmit={handleReschedule}
    >
      <h2>Reschedule Appointment</h2>
      <p>
        Visitor: <strong>{rescheduleVisitor.name}</strong>
      </p>

      <label htmlFor="newAppointmentDate">
        New appointment date & time
      </label>

      <input
        id="newAppointmentDate"
        type="datetime-local"
        value={newAppointmentDate}
        onChange={(e) => setNewAppointmentDate(e.target.value)}
        required
      />

      <div className="appointment-modal-actions">
        <button
          type="button"
          className="appointment-modal-cancel"
          disabled={rescheduleLoading}
          onClick={() => setRescheduleVisitor(null)}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="appointment-modal-save"
          disabled={rescheduleLoading}
        >
          {rescheduleLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  </div>
)}

    </div>
  );
}
