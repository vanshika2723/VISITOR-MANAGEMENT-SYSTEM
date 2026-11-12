
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode } from "lucide-react";

import QRScanner from "../components/QRScanner";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState("");

  const handleScan = (decodedText) => {
    setScanError("");

    try {
      // Extract token from the scanned verification URL
      const match = decodedText.match(
        /\/verify-visitor\/([a-f0-9]{64})(?:\/)?(?:\?.*)?$/i
      );

      // Also support scanning a raw token
      const token = match ? match[1] : decodedText.trim();

      if (!/^[a-f0-9]{64}$/i.test(token)) {
        setScanError("Invalid QR code. Please scan a valid VisitPro visitor pass.");
        return;
      }

      navigate(`/verify-visitor/${token}`);
    } catch {
      setScanError("Unable to read QR code. Please try again.");
    }
  };

  return (
    <div className="qr-scanner-page">
      <button
        className="visitor-back-button"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="qr-scanner-page-heading">
        <QrCode size={30} />
        <div>
          <h2>Visitor QR Scanner</h2>
          <p>Scan a visitor's official VisitPro access pass.</p>
        </div>
      </div>

      <QRScanner onScan={handleScan} />

      {scanError && (
        <p className="qr-scanner-error">{scanError}</p>
      )}
    </div>
  );
};

export default QRScannerPage;
