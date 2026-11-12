
import React, { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  ShieldCheck,
  Save,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Settings as SettingsIcon,
} from "lucide-react";
import api from "../services/api";

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    companyLogo: "",
    companyAddress: "",
    contactEmail: "",
    contactPhone: "",
    timezone: "Asia/Kolkata",
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
    visitorPassExpiryHours: 12,
    requireApproval: true,
    allowWalkInVisitors: true,
    allowMultipleVisits: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/settings");

      if (response.data?.settings) {
        setSettings((current) => ({
          ...current,
          ...response.data.settings,
          workingHours: {
            ...current.workingHours,
            ...response.data.settings.workingHours,
          },
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleWorkingHours = (e) => {
    const { name, value } = e.target;

    setSettings((current) => ({
      ...current,
      workingHours: {
        ...current.workingHours,
        [name]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        ...settings,
        visitorPassExpiryHours: Number(
          settings.visitorPassExpiryHours
        ),
      };

      const response = await api.put("/settings", payload);

      setSettings((current) => ({
        ...current,
        ...response.data.settings,
      }));

      setMessage(
        response.data.message || "Settings saved successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <RefreshCw className="settings-spin" size={24} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">ADMINISTRATION</span>
          <h1>System Settings</h1>
          <p>Manage your company profile and visitor policies.</p>
        </div>

        <div className="settings-header-icon">
          <SettingsIcon size={25} />
        </div>
      </div>

      {message && (
        <div className="settings-alert success">{message}</div>
      )}

      {error && (
        <div className="settings-alert error">{error}</div>
      )}

      <form onSubmit={handleSave}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon">
              <Building2 size={20} />
            </div>
            <div>
              <h2>Company Profile</h2>
              <p>Basic information about your organization.</p>
            </div>
          </div>

          <div className="settings-grid">
            <label className="settings-field">
              Company Name
              <input
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                required
              />
            </label>

            <label className="settings-field">
              Contact Email
              <span className="settings-input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                />
              </span>
            </label>

            <label className="settings-field">
              Contact Phone
              <span className="settings-input-icon">
                <Phone size={16} />
                <input
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleChange}
                />
              </span>
            </label>

            <label className="settings-field">
              Company Address
              <span className="settings-input-icon">
                <MapPin size={16} />
                <input
                  name="companyAddress"
                  value={settings.companyAddress}
                  onChange={handleChange}
                />
              </span>
            </label>

            <label className="settings-field full-width">
              Company Logo URL
              <input
                name="companyLogo"
                value={settings.companyLogo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon">
              <Clock size={20} />
            </div>
            <div>
              <h2>Working Hours</h2>
              <p>Set your organization's operating hours.</p>
            </div>
          </div>

          <div className="settings-grid">
            <label className="settings-field">
              Opening Time
              <input
                type="time"
                name="start"
                value={settings.workingHours.start}
                onChange={handleWorkingHours}
                required
              />
            </label>

            <label className="settings-field">
              Closing Time
              <input
                type="time"
                name="end"
                value={settings.workingHours.end}
                onChange={handleWorkingHours}
                required
              />
            </label>

            <label className="settings-field full-width">
              Timezone
              <select
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
              >
                <option value="Asia/Kolkata">
                  India Standard Time (IST)
                </option>
                <option value="Asia/Dubai">Dubai</option>
                <option value="Europe/London">London</option>
                <option value="America/New_York">New York</option>
              </select>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2>Visitor Policies</h2>
              <p>Configure visitor access and approval rules.</p>
            </div>
          </div>

          <div className="settings-grid">
            <label className="settings-field">
              Visitor Pass Expiry (Hours)
              <input
                type="number"
                name="visitorPassExpiryHours"
                min="1"
                max="72"
                value={settings.visitorPassExpiryHours}
                onChange={handleChange}
                required
              />
              <small>Allowed range: 1–72 hours.</small>
            </label>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle">
              <span>
                <strong>Require Visitor Approval</strong>
                <small>Visitors must be approved before check-in.</small>
              </span>
              <input
                type="checkbox"
                name="requireApproval"
                checked={settings.requireApproval}
                onChange={handleChange}
              />
            </label>

            <label className="settings-toggle">
              <span>
                <strong>Allow Walk-in Visitors</strong>
                <small>Allow visitors without prior appointments.</small>
              </span>
              <input
                type="checkbox"
                name="allowWalkInVisitors"
                checked={settings.allowWalkInVisitors}
                onChange={handleChange}
              />
            </label>

            <label className="settings-toggle">
              <span>
                <strong>Allow Multiple Visits</strong>
                <small>Allow repeat visits by the same visitor.</small>
              </span>
              <input
                type="checkbox"
                name="allowMultipleVisits"
                checked={settings.allowMultipleVisits}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={loadSettings}
            disabled={saving}
          >
            <RefreshCw size={17} />
            Reset Changes
          </button>

          <button
            type="submit"
            className="settings-save-btn"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
