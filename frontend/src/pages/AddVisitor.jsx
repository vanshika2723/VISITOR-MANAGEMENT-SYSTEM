
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  Upload,
  User,
  Building2,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";

const AddVisitor = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    purpose: "",
    host: "",
    appointmentDate: "",
    idType: "none",
idNumber: "",
    notes: "",
  });

  const [hosts, setHosts] = useState([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
const [cameraError, setCameraError] = useState("");
const videoRef = useRef(null);
const streamRef = useRef(null);
const photoInputRef = useRef(null);

  // Load active employees
  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const response = await api.get("/users/hosts");
        setHosts(response.data.hosts || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load employees. Please refresh the page."
        );
      } finally {
        setHostsLoading(false);
      }
    };

    fetchHosts();
  }, []);

useEffect(() => {
  if (cameraOpen && videoRef.current && streamRef.current) {
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }
}, [cameraOpen]);

useEffect(() => {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

const startCamera = async () => {
  try {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported. Please use localhost or HTTPS.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    streamRef.current = stream;
    setCameraOpen(true);
  } catch (error) {
    console.error("Camera error:", error);
    setCameraError(
      "Camera access denied. Please allow camera permission in your browser."
    );
  }
};

const stopCamera = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  setCameraOpen(false);
};

const capturePhoto = () => {
  const video = videoRef.current;

  if (!video || !video.videoWidth || !video.videoHeight) {
    setCameraError("Camera is not ready. Please try again.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        setCameraError("Could not capture photo. Please try again.");
        return;
      }

      if (blob.size > 5 * 1024 * 1024) {
        setCameraError("Captured photo exceeds 5 MB.");
        return;
      }

      const file = new File([blob], "visitor-camera.jpg", {
        type: "image/jpeg",
      });

      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setCameraError("");
      stopCamera();
    },
    "image/jpeg",
    0.9
  );
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!/^[0-9]{10,15}$/.test(form.phone.trim())) {
      setError("Enter a valid phone number (10–15 digits).");
      return;
    }

    if (!form.host) {
      setError("Please select a host employee.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await api.post("/visitors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(
        response.data.message || "Visitor registered successfully!"
      );

      setTimeout(() => {
        navigate("/visitors");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Visitor registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-visitor-page">
      <div className="add-visitor-header">
        <div>
          <h2>Register New Visitor</h2>
          <p>Enter visitor information to create a new visitor record.</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/visitors")}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to Visitors
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="visitor-form-card">
          <div className="visitor-form-heading">
            <div className="form-heading-icon">
              <User size={20} />
            </div>
            <div>
              <h3>Personal Information</h3>
              <p>Basic details of the visitor</p>
            </div>
          </div>

          <div className="visitor-form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter visitor name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
                maxLength={15}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="visitor@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="company"
                placeholder="Enter company name"
                value={form.company}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="visitor-form-card">
          <div className="visitor-form-heading">
            <div className="form-heading-icon">
              <Building2 size={20} />
            </div>
            <div>
              <h3>Visit Information</h3>
              <p>Purpose and appointment details</p>
            </div>
          </div>

          <div className="visitor-form-grid">
            <div className="form-group full-width">
              <label>Purpose of Visit *</label>
              <textarea
                name="purpose"
                placeholder="Describe the reason for visiting..."
                value={form.purpose}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Host Employee *</label>
              <select
                name="host"
                value={form.host}
                onChange={handleChange}
                required
                disabled={hostsLoading || hosts.length === 0}
              >
                <option value="">
                  {hostsLoading
                    ? "Loading employees..."
                    : hosts.length === 0
                      ? "No active employees found"
                      : "Select host employee"}
                </option>

                {hosts.map((host) => (
                  <option key={host._id} value={host._id}>
                    {host.name} ({host.email})
                  </option>
                ))}
              </select>

              <small>
                Select the employee whom the visitor wants to meet.
              </small>
            </div>

            <div className="form-group">
              <label>Appointment Date *</label>
              <input
                type="date"
                name="appointmentDate"
                value={form.appointmentDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Add any additional information..."
                value={form.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>
        </div>

<div className="visitor-form-card">
  <div className="visitor-form-heading">
    <div className="form-heading-icon">
      <User size={20} />
    </div>
    <div>
      <h3>Identity Verification</h3>
      <p>Record the visitor's identity document</p>
    </div>
  </div>

  <div className="visitor-form-grid">
    <div className="form-group">
      <label htmlFor="idType">Identity Document</label>
      <select
        id="idType"
        name="idType"
        value={form.idType}
        onChange={handleChange}
      >
        <option value="none">No document</option>
        <option value="passport">Passport</option>
        <option value="driving_license">Driving License</option>
        <option value="voter_id">Voter ID</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div className="form-group">
      <label htmlFor="idNumber">Document Number</label>
      <input
        id="idNumber"
        type="password"
        name="idNumber"
        value={form.idNumber}
        onChange={handleChange}
        placeholder="Enter document number"
        maxLength={50}
        autoComplete="off"
      />
      <small>Visible only as masked characters while typing.</small>
    </div>
  </div>
</div>

        <div className="visitor-form-card">
          <div className="visitor-form-heading">
            <div className="form-heading-icon">
              <Upload size={20} />
            </div>
            <div>
              <h3>Visitor Photograph</h3>
              <p>Upload a visitor photo (optional)</p>
            </div>
          </div>

          <label className="visitor-upload-area">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Visitor preview"
                className="visitor-photo-preview"
              />
            ) : (
              <>
                <Upload size={30} />
                <strong>Click to upload visitor photo</strong>
                <span>JPG, PNG or WEBP · Maximum 5 MB</span>
              </>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              hidden
            />
          </label>

<div className="camera-actions">
  {!cameraOpen ? (
    <button
      type="button"
      className="camera-btn"
      onClick={startCamera}
    >
      Open Camera
    </button>
  ) : (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="visitor-camera-preview"
      />

      <div className="camera-button-row">
        <button
          type="button"
          className="camera-btn"
          onClick={capturePhoto}
        >
          Capture Photo
        </button>

        <button
          type="button"
          className="camera-cancel-btn"
          onClick={stopCamera}
        >
          Cancel
        </button>
      </div>
    </>
  )}

  {cameraError && (
    <p className="camera-error">{cameraError}</p>
  )}
</div>

          {photo && (
            <p className="selected-photo-name">{photo.name}</p>
          )}
        </div>

        {error && <div className="form-message error">{error}</div>}
        {success && <div className="form-message success">{success}</div>}

        <div className="visitor-form-actions">
          <button
            type="button"
            className="cancel-form-button"
            onClick={() => navigate("/visitors")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-visitor-button"
            disabled={loading || hostsLoading || hosts.length === 0}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="button-spinner" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Register Visitor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVisitor;
