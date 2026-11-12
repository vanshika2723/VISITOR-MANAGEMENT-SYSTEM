
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  QrCode,
  ShieldCheck,
  ShieldX,
  LoaderCircle,
  ArrowLeft,
  UserRound,
  Building2,
  Phone,
  Briefcase,
  CalendarDays,
} from "lucide-react";

import api from "../services/api";

const VerifyVisitor = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verifyPass = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.get(`/qr/verify/${token}`);
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to verify visitor pass."
      );
    } finally {
      setLoading(false);
    }
  };

  const visitor = result?.visitor;

  return (
    <div className="verify-visitor-page">
      <button
        className="visitor-back-button"
        onClick={() => navigate("/visitors")}
      >
        <ArrowLeft size={18} />
        Back to Visitors
      </button>

      <div className="verify-visitor-card">
        <div className="verify-visitor-icon">
          <QrCode size={32} />
        </div>

        <h2>Visitor QR Verification</h2>
        <p>Verify the visitor pass before allowing office entry.</p>

        {!result && !error && (
          <button
            className="visitor-print-button"
            onClick={verifyPass}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Verify Visitor Pass
              </>
            )}
          </button>
        )}

        {error && (
          <div className="verify-result rejected">
            <ShieldX size={34} />
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <button onClick={verifyPass} disabled={loading}>
              Try Again
            </button>
          </div>
        )}

        {result?.verified && visitor && (
          <div className="verify-result approved">
            <ShieldCheck size={38} />
            <h3>Visitor Pass Verified</h3>
            <p>{result.message}</p>

            <div className="verify-visitor-details">
              <div>
                <UserRound size={17} />
                <span>Name</span>
                <strong>{visitor.name}</strong>
              </div>

              <div>
                <QrCode size={17} />
                <span>Visitor ID</span>
                <strong>{visitor.visitorId}</strong>
              </div>

              <div>
                <Phone size={17} />
                <span>Phone</span>
                <strong>{visitor.phone}</strong>
              </div>

              <div>
                <Building2 size={17} />
                <span>Company</span>
                <strong>{visitor.company || "Not available"}</strong>
              </div>

              <div>
                <Briefcase size={17} />
                <span>Purpose</span>
                <strong>{visitor.purpose}</strong>
              </div>

              <div>
                <CalendarDays size={17} />
                <span>Appointment</span>
                <strong>
                  {visitor.appointmentDate
                    ? new Date(visitor.appointmentDate).toLocaleString("en-IN")
                    : "Not available"}
                </strong>
              </div>
            </div>

            <p className="verify-entry-note">
              Pass is valid for verification. Complete check-in separately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyVisitor;
