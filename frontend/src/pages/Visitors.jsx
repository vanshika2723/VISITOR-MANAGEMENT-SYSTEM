
import React, { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  UserPlus,
  Eye,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const Visitors = () => {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/visitors", {
        params: {
          search: search || undefined,
          approvalStatus: approvalFilter || undefined,
          visitStatus: statusFilter || undefined,
        },
      });

      const data = response.data;

      setVisitors(
        data.visitors ||
        data.data?.visitors ||
        data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load visitors."
      );
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [search, approvalFilter, statusFilter]);

  const handleAction = async (visitor, action) => {
    const actionNames = {
      approve: "approve this visitor",
      reject: "reject this visitor",
      "check-in": "check in this visitor",
      "check-out": "check out this visitor",
    };

    if (!window.confirm(`Are you sure you want to ${actionNames[action]}?`)) {
      return;
    }

    try {
      setActionLoading(`${visitor._id}-${action}`);

      const response = await api.patch(
        `/visitor-workflow/${visitor._id}/${action}`
      );

      alert(response.data.message || "Action completed successfully.");

      await fetchVisitors();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to complete this action."
      );
    } finally {
      setActionLoading("");
    }
  };

const handleVerifyId = async (visitor) => {
  if (!visitor.idType || visitor.idType === "none") {
    alert("This visitor has no identity document recorded.");
    return;
  }

  const confirmed = window.confirm(
    `Have you physically checked the identity document for ${visitor.name}?`
  );

  if (!confirmed) return;

  try {
    setActionLoading(`${visitor._id}-verify-id`);

    const response = await api.patch(
      `/visitors/${visitor._id}/verify-id`
    );

    alert(response.data.message || "Visitor ID verified successfully.");

    await fetchVisitors();
  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Unable to verify visitor ID."
    );
  } finally {
    setActionLoading("");
  }
};

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const ActionButton = ({
    visitor,
    action,
    title,
    icon: Icon,
    className,
  }) => {
    const isLoading =
      actionLoading === `${visitor._id}-${action}`;

    return (
      <button
        className={`visitor-action-button ${className}`}
        title={title}
        disabled={Boolean(actionLoading)}
        onClick={() => handleAction(visitor, action)}
      >
        {isLoading ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <Icon size={16} />
        )}
      </button>
    );
  };

  const renderActions = (visitor) => {
    const approval = visitor.approvalStatus?.toLowerCase();
    const status = visitor.visitStatus?.toLowerCase();

    return (
      <div className="visitor-actions">

        <button
          className="visitor-view-button"
          title="View visitor"
          onClick={() => navigate(`/visitors/${visitor._id}`)}
        >
          <Eye size={17} />
        </button>

{!visitor.idVerified && visitor.idType && visitor.idType !== "none" && (
  <button
    className="visitor-action-button approve-action"
    title="Verify visitor identity document"
    disabled={Boolean(actionLoading)}
    onClick={() => handleVerifyId(visitor)}
  >
    {actionLoading === `${visitor._id}-verify-id` ? (
      <LoaderCircle className="spin" size={16} />
    ) : (
      <ShieldCheck size={16} />
    )}
  </button>
)}

        {approval === "pending" && (
          <>
            <ActionButton
              visitor={visitor}
              action="approve"
              title="Approve visitor"
              icon={CheckCircle}
              className="approve-action"
            />

            <ActionButton
              visitor={visitor}
              action="reject"
              title="Reject visitor"
              icon={XCircle}
              className="reject-action"
            />
          </>
        )}

        {approval === "approved" && status === "registered" && (
          <ActionButton
            visitor={visitor}
            action="check-in"
            title="Check in visitor"
            icon={LogIn}
            className="checkin-action"
          />
        )}

        {status === "checked-in" && (
          <ActionButton
            visitor={visitor}
            action="check-out"
            title="Check out visitor"
            icon={LogOut}
            className="checkout-action"
          />
        )}

      </div>
    );
  };

  return (
    <div className="visitors-page">

      <div className="visitors-page-header">
        <div>
          <h2>All Visitors</h2>
          <p>Manage and monitor registered office visitors.</p>
        </div>

        <button
          className="visitor-add-button"
          onClick={() => navigate("/visitors/add")}
        >
          <UserPlus size={17} />
          Register Visitor
        </button>
      </div>

      <div className="visitor-toolbar">

        <div className="visitor-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search name, phone or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="visitor-filter">
          <Filter size={16} />
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="visitor-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Visit Status</option>
            <option value="registered">Registered</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          className="visitor-refresh-button"
          onClick={fetchVisitors}
          title="Refresh visitors"
        >
          <RefreshCw size={17} />
        </button>

      </div>

      <div className="visitor-list-card">

        <div className="visitor-list-heading">
          <div>
            <h3>Visitor Records</h3>
            <p>{visitors.length} records displayed</p>
          </div>
          <Users size={22} />
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
            <button onClick={fetchVisitors}>Retry</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="dashboard-table visitor-list-table">

            <thead>
              <tr>
                <th>Visitor Details</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Host</th>
                <th>Appointment</th>
                <th>Approval</th>
                <th>Visit Status</th>
                <th>ID Verification</th>
                <th>Actions</th>

              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Loading visitor records...
                  </td>
                </tr>
              ) : visitors.length > 0 ? (
                visitors.map((visitor) => (
                  <tr key={visitor._id}>

                    <td>
                      <div className="visitor-table-name">
                       
<div className="visitor-table-avatar">
  {visitor.photo ? (
    <img
      src={
        visitor.photo.startsWith("http")
          ? visitor.photo
          : `http://localhost:5000/${visitor.photo.replace(/^\/+/, "")}`
      }
      alt={visitor.name || "Visitor"}
      className="visitor-table-photo"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    visitor.name?.charAt(0)?.toUpperCase() || "V"
  )}
</div>

                        <div>
                          <strong>{visitor.name}</strong>
                          <span>{visitor.visitorId}</span>
                        </div>
                      </div>
                    </td>

                    <td>{visitor.company || "—"}</td>
                    <td>{visitor.phone || "—"}</td>
                    <td>{visitor.host?.name || "—"}</td>
                    <td>{formatDate(visitor.appointmentDate)}</td>

                    <td>
                      <span className={`status-badge ${visitor.approvalStatus}`}>
                        {visitor.approvalStatus}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge ${visitor.visitStatus}`}>
                        {visitor.visitStatus}
                      </span>
                    </td>

<td>
  {visitor.idType && visitor.idType !== "none" ? (
    <span
      className={`status-badge ${
        visitor.idVerified ? "approved" : "pending"
      }`}
    >
      {visitor.idVerified ? "Verified" : "Pending"}
    </span>
  ) : (
    <span className="status-badge">Not Provided</span>
  )}
</td>

                    <td>{renderActions(visitor)}</td>

                  </tr>
                ))
              ) : (
                <tr>
                <td colSpan="9" className="empty-table">
                    No visitors found.
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

export default Visitors;
