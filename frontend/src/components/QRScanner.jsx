
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, AlertCircle } from "lucide-react";

const QRScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("visitpro-qr-reader");
    scannerRef.current = scanner;

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setError("");

      const scanner = scannerRef.current;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            await scanner.stop();
          } catch {}

          setScanning(false);
          onScan?.(decodedText);
        },
        () => {}
      );

      setScanning(true);
    } catch (err) {
      setError(
        "Camera access failed. Please allow camera permission and try again."
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      setScanning(false);
    } catch {
      setError("Unable to stop camera.");
    }
  };

  return (
    <div className="qr-scanner-card">
      <div className="qr-scanner-heading">
        <Camera size={24} />
        <div>
          <h3>Scan Visitor QR Pass</h3>
          <p>Place the visitor QR code inside the camera frame.</p>
        </div>
      </div>

      <div id="visitpro-qr-reader" />

      {error && (
        <div className="qr-scanner-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="qr-scanner-actions">
        {!scanning ? (
          <button
            className="visitor-print-button"
            onClick={startScanner}
          >
            <Camera size={18} />
            Start Camera Scanner
          </button>
        ) : (
          <button
            className="visitor-print-button"
            onClick={stopScanner}
          >
            <CameraOff size={18} />
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
