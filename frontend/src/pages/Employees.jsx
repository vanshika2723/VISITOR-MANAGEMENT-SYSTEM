
import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Briefcase,
  LoaderCircle,
  UserRound,
} from "lucide-react";

import api from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  designation: "",
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");

      const users = response.data.users || [];

      setEmployees(users.filter((user) => user.role === "employee"));
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/users", {
        ...form,
        role: "employee",
      });

      setSuccess("Employee account created successfully!");
      setForm(initialForm);
      setShowForm(false);

      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create employee."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const value = search.toLowerCase();

    return (
      employee.name?.toLowerCase().includes(value) ||
      employee.email?.toLowerCase().includes(value) ||
      employee.department?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="employees-page">
      <div className="employees-header">
        <div>
          <h2>Employee Management</h2>
          <p>Manage company employees and their accounts.</p>
        </div>

        <button
          className="add-employee-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
        >
          <UserPlus size={17} />
          Add Employee
        </button>
      </div>

      {error && <div className="employee-message error">{error}</div>}
      {success && (
        <div className="employee-message success">{success}</div>
      )}

      {showForm && (
        <div className="employee-form-card">
          <div className="employee-form-title">
            <UserPlus size={20} />
            <div>
              <h3>Create Employee Account</h3>
              <p>Enter the employee's details below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="employee-form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Employee name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="employee@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Software Developer"
                />
              </div>
            </div>

            <div className="employee-form-actions">
              <button
                type="button"
                className="cancel-form-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-visitor-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle size={16} className="button-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Employee
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="employee-stats-card">
        <div className="employee-stats-icon">
          <Users size={22} />
        </div>
        <div>
          <span>Total Employees</span>
          <h3>{employees.length}</h3>
        </div>
      </div>

      <div className="employee-list-card">
        <div className="employee-list-header">
          <div>
            <h3>All Employees</h3>
            <p>Company employee directory</p>
          </div>

          <div className="employee-search">
            <Search size={16} />
            <input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="employee-loading">
            <LoaderCircle className="button-spinner" size={25} />
            <p>Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="employee-empty">
            <UserRound size={35} />
            <h3>No Employees Found</h3>
            <p>Create an employee account to get started.</p>
          </div>
        ) : (
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>
                      <div className="employee-name-cell">
                        <div className="employee-avatar">
                          {employee.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{employee.name}</strong>
                          <span>
                            <Mail size={12} />
                            {employee.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="employee-detail">
                        <Building2 size={14} />
                        {employee.department || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="employee-detail">
                        <Briefcase size={14} />
                        {employee.designation || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="employee-detail">
                        <Phone size={14} />
                        {employee.phone || "—"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`employee-status ${
                          employee.isActive ? "active" : "inactive"
                        }`}
                      >
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
