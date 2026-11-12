
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Building2,
  Phone,
  Mail,
  CalendarDays,
  Clock,
  Briefcase,
  LoaderCircle,
  AlertCircle,
  QrCode,
} from "lucide-react";

import api from "../services/api";

const VisitorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const response = await api.get(`/visitors/${id}`);
        setVisitor(
          response.data.visitor ||
          response.data.data?.visitor ||
          response.data.data
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load visitor details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVisitor();
  }, [id]);

  if (loading) {
    return (
      <div className="visitor-details-loading">
        <LoaderCircle className="spin" size={28} />
        <p>Loading visitor details...</p>
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="visitor-details-error">
        <AlertCircle size={30} />
        <h3>Visitor not found</h3>
        <p>{error || "No visitor details available."}</p>
        <button onClick={() => navigate("/visitors")}>
          Back to Visitors
        </button>
      </div>
    );
  }

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("en-IN") : "Not available";

  const Detail = ({ icon: Icon, label, value }) => (
    <div className="visitor-detail-item">
      <div className="visitor-detail-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value || "Not available"}</strong>
      </div>
    </div>
  );

  return (
    <div className="visitor-details-page">
      <button
        className="visitor-back-button"
        onClick={() => navigate("/visitors")}
      >
        <ArrowLeft size={18} />
        Back to Visitors
      </button>

      <div className="visitor-details-header">
        <div>
          <span className="visitor-details-label">VISITOR PROFILE</span>
          <h2>{visitor.name}</h2>
          <p>Visitor ID: {visitor.visitorId || visitor._id}</p>
        </div>

        <div className="visitor-header-actions">
          <span className="visitor-status-badge">
            {visitor.approvalStatus || "Pending"}
          </span>

          {visitor.approvalStatus === "approved" && (
            <button
              className="visitor-print-button"
              onClick={() => navigate(`/visitors/${visitor._id}/pass`)}
            >
              <QrCode size={17} />
              Generate QR Pass
            </button>
          )}
        </div>
      </div>

      <div className="visitor-details-card">
        <h3>Personal Information</h3>
        <div className="visitor-details-grid">
          <Detail icon={UserRound} label="Full Name" value={visitor.name} />
          <Detail icon={Phone} label="Phone" value={visitor.phone} />
          <Detail icon={Mail} label="Email" value={visitor.email} />
          <Detail icon={Building2} label="Company" value={visitor.company} />
        </div>
      </div>

      <div className="visitor-details-card">
        <h3>Visit Information</h3>
        <div className="visitor-details-grid">
          <Detail icon={Briefcase} label="Purpose" value={visitor.purpose} />
          <Detail
            icon={UserRound}
            label="Host"
            value={visitor.host?.name || visitor.hostName}
          />
          <Detail
            icon={CalendarDays}
            label="Appointment Date"
            value={formatDate(visitor.appointmentDate)}
          />
          <Detail
            icon={Clock}
            label="Visit Status"
            value={visitor.visitStatus}
          />
        </div>
      </div>

      <div className="visitor-details-card">
        <h3>Entry & Exit Information</h3>
        <div className="visitor-details-grid">
          <Detail
            icon={Clock}
            label="Check-in Time"
            value={formatDate(visitor.checkInTime)}
          />
          <Detail
            icon={Clock}
            label="Check-out Time"
            value={formatDate(visitor.checkOutTime)}
          />
          <Detail
            icon={CalendarDays}
            label="Created At"
            value={formatDate(visitor.createdAt)}
          />
        </div>
      </div>
    </div>
  );
};

export default VisitorDetails;
