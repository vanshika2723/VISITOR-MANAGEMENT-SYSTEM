
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  Printer,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";

import api from "../services/api";

const VisitorPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const response = await api.get(`/visitors/${id}/pass`);

        setVisitor(
          response.data.visitor ||
          response.data.data?.visitor ||
          response.data.data
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to generate visitor pass."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPass();
  }, [id]);

  const verificationUrl = visitor?.passToken
    ? `${window.location.origin}/verify-visitor/${visitor.passToken}`
    : "";

  const copyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
    } catch {
      setError("Unable to copy link. Please copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="visitor-details-loading">
        <LoaderCircle className="spin" size={28} />
        <p>Generating visitor pass...</p>
      </div>
    );
  }

  if (error && !visitor) {
    return (
      <div className="visitor-details-error">
        <AlertCircle size={30} />
        <h3>Pass unavailable</h3>
        <p>{error}</p>
        <button onClick={() => navigate("/visitors")}>
          Back to Visitors
        </button>
      </div>
    );
  }

  if (!visitor) return null;

  if (visitor.approvalStatus !== "approved") {
    return (
      <div className="visitor-details-error">
        <ShieldCheck size={32} />
        <h3>Pass not available</h3>
        <p>Visitor approval is required before generating the pass.</p>
        <button onClick={() => navigate(`/visitors/${id}`)}>
          Back to Visitor Details
        </button>
      </div>
    );
  }

  return (
    <div className="visitor-pass-page">
      <button
        className="visitor-back-button"
        onClick={() => navigate(`/visitors/${id}`)}
      >
        <ArrowLeft size={18} />
        Back to Visitor
      </button>

      <div className="visitor-pass-card">
        <div className="visitor-pass-brand">
          <ShieldCheck size={28} />
          <div>
            <h2>VISITPRO</h2>
            <p>OFFICIAL VISITOR ACCESS PASS</p>
          </div>
        </div>

        <div className="visitor-pass-divider" />

        <div className="visitor-pass-content">
          <div className="visitor-pass-information">
            <span className="visitor-pass-label">VISITOR PASS</span>

            <h2>{visitor.name}</h2>

            <p className="visitor-pass-id">{visitor.visitorId}</p>

            <div className="visitor-pass-detail">
              <span>Company</span>
              <strong>{visitor.company || "—"}</strong>
            </div>

            <div className="visitor-pass-detail">
              <span>Purpose</span>
              <strong>{visitor.purpose || "—"}</strong>
            </div>

            <div className="visitor-pass-detail">
              <span>Host</span>
              <strong>{visitor.host?.name || "—"}</strong>
            </div>

            <div className="visitor-pass-detail">
              <span>Appointment</span>
              <strong>
                {visitor.appointmentDate
                  ? new Date(visitor.appointmentDate).toLocaleString("en-IN")
                  : "—"}
              </strong>
            </div>

            <span className="visitor-pass-approved">
              <ShieldCheck size={15} />
              APPROVED VISITOR
            </span>
          </div>

          <div className="visitor-pass-qr">
            {verificationUrl ? (
              <QRCodeSVG
                value={verificationUrl}
                size={190}
                level="H"
                includeMargin
              />
            ) : (
              <p>QR token unavailable</p>
            )}

            <strong>SCAN TO VERIFY</strong>
            <span>Show this QR code at reception</span>
          </div>
        </div>

        <div className="visitor-pass-footer">
          <p>Authorized access only</p>
          <p>Visitor Management System</p>
        </div>
      </div>

      {verificationUrl && (
        <div className="visitor-pass-actions">
          <button
            className="visitor-print-button"
            onClick={copyVerificationLink}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Link Copied" : "Copy Verification Link"}
          </button>

          <button
            className="visitor-print-button"
            onClick={() => navigate(`/verify-visitor/${visitor.passToken}`)}
          >
            <ExternalLink size={17} />
            Open Verification Page
          </button>

          <button
            className="visitor-print-button"
            onClick={() => window.print()}
          >
            <Printer size={17} />
            Print Visitor Pass
          </button>
        </div>
      )}

      {error && <p>{error}</p>}
    </div>
  );
};

export default VisitorPass;
