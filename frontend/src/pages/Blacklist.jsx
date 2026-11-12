
import { useEffect, useState } from "react";
import axios from "axios";


const API_URL = "http://localhost:5000/api/blacklist";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("visitor_token")}`,
  },
});

export default function Blacklist() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("blocked");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    reason: "",
    notes: "",
  });

  const loadBlacklist = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL, {
        ...getAuthConfig(),
        params: {
          status,
          search: search.trim(),
        },
      });

    const data = response.data;

console.log("Blacklist API Data:", data);

setVisitors(
  Array.isArray(data)
    ? data
    : data.entries ||
      data.blacklist ||
      data.records ||
      data.data ||
      []
);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Blacklist records load nahi ho sake."
      );
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlacklist();
  }, [status]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadBlacklist();
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await axios.post(
        API_URL,
        form,
        getAuthConfig()
      );

      setMessage("Visitor successfully blacklist mein add ho gaya.");
      setForm({
        name: "",
        phone: "",
        email: "",
        reason: "",
        notes: "",
      });

      setStatus("blocked");
      await loadBlacklist();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Visitor ko blacklist mein add nahi kar sake."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (id) => {
    const confirmed = window.confirm(
      "Kya aap is visitor ko unblock karna chahte hain?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await axios.patch(
        `${API_URL}/${id}/unblock`,
        {},
        getAuthConfig()
      );

      setMessage("Visitor successfully unblock ho gaya.");
      await loadBlacklist();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Visitor ko unblock nahi kar sake."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div className="blacklist-page">
      <div className="blacklist-header">
        <div>
          <span className="blacklist-eyebrow">
            SECURITY MANAGEMENT
          </span>
          <h1>Visitor Blacklist</h1>
          <p>
            Manage restricted visitors and maintain office security.
          </p>
        </div>

        <div className="blacklist-header-icon">🛡️</div>
      </div>

      {message && (
        <div className="blacklist-alert success">{message}</div>
      )}

      {error && (
        <div className="blacklist-alert error">{error}</div>
      )}

      <div className="blacklist-layout">
        <section className="blacklist-card blacklist-form-card">
          <div className="blacklist-section-heading">
            <div>
              <h2>Add Restricted Visitor</h2>
              <p>Enter the visitor details and reason.</p>
            </div>
            <span className="blacklist-heading-icon">＋</span>
          </div>

          <form onSubmit={handleAdd} className="blacklist-form">
            <label>
              Visitor Name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                maxLength={100}
              />
            </label>

            <label>
              Phone Number *
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
                minLength={10}
                maxLength={20}
              />
            </label>

            <label>
              Email Address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="visitor@example.com"
              />
            </label>

            <label>
              Blacklist Reason *
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Explain why access is restricted"
                required
                maxLength={500}
                rows={3}
              />
            </label>

            <label>
              Internal Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional internal notes"
                rows={2}
              />
            </label>

            <button
              type="submit"
              className="blacklist-submit-btn"
              disabled={saving}
            >
              {saving ? "Adding..." : "+ Add to Blacklist"}
            </button>
          </form>
        </section>

        <section className="blacklist-card blacklist-records-card">
          <div className="blacklist-section-heading">
            <div>
              <h2>Blacklist Records</h2>
              <p>Review and manage restricted access.</p>
            </div>
            <span className="blacklist-record-count">
              {visitors.length} records
            </span>
          </div>

          <div className="blacklist-filters">
            <div className="blacklist-status-tabs">
              <button
                type="button"
                className={status === "blocked" ? "active" : ""}
                onClick={() => setStatus("blocked")}
              >
                Blocked
              </button>

              <button
                type="button"
                className={status === "unblocked" ? "active" : ""}
                onClick={() => setStatus("unblocked")}
              >
                Unblocked
              </button>
            </div>

            <form
              className="blacklist-search"
              onSubmit={handleSearch}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone..."
              />
              <button type="submit">Search</button>
            </form>
          </div>

          {loading ? (
            <div className="blacklist-empty">
              Loading blacklist records...
            </div>
          ) : visitors.length === 0 ? (
            <div className="blacklist-empty">
              <div className="blacklist-empty-icon">🔎</div>
              <h3>No records found</h3>
              <p>
                {status === "blocked"
                  ? "No blocked visitors match your search."
                  : "No unblocked visitors match your search."}
              </p>
            </div>
          ) : (
            <div className="blacklist-table-wrap">
              <table className="blacklist-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Reason</th>
                    <th>Blocked On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor._id}>
                      <td>
                        <div className="blacklist-visitor-name">
                          {visitor.name}
                        </div>
                        <div className="blacklist-visitor-contact">
                          {visitor.phone}
                        </div>
                        {visitor.email && (
                          <div className="blacklist-visitor-contact">
                            {visitor.email}
                          </div>
                        )}
                      </td>

                      <td className="blacklist-reason">
                        {visitor.reason}
                      </td>

                      <td>{formatDate(visitor.blockedAt)}</td>

                      <td>
                        <span
                          className={`blacklist-status ${
                            visitor.status === "blocked"
                              ? "blocked"
                              : "unblocked"
                          }`}
                        >
                          {visitor.status}
                        </span>
                      </td>

                      <td>
                        {visitor.status === "blocked" ? (
                          <button
                            type="button"
                            className="blacklist-unblock-btn"
                            onClick={() =>
                              handleUnblock(visitor._id)
                            }
                          >
                            Unblock
                          </button>
                        ) : (
                          <span className="blacklist-muted">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
