
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  UserCheck,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../services/api";

const APPROVAL_COLORS = {
  Approved: "#22A06B",
  Pending: "#E8AE37",
  Rejected: "#E45B5B",
};

const VISIT_COLORS = {
  "Checked-in": "#F47721",
  "Checked-out": "#22A06B",
  "Not started": "#8B5CF6",
};

const EMPTY_STATS = {
  total: 0,
  today: 0,
  checkedIn: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  checkedOut: 0,
};

const formatLabel = (value) => {
  const text = String(value || "not started");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const getVisitorRecords = (responseData) => {
  if (Array.isArray(responseData?.visitors)) {
    return responseData.visitors;
  }

  if (Array.isArray(responseData?.data?.visitors)) {
    return responseData.data.visitors;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  return [];
};

export default function Reports() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Accurate totals returned by the backend analytics API
  const [stats, setStats] = useState(EMPTY_STATS);
  const [monthlyData, setMonthlyData] = useState([]);
  const [approvalChartData, setApprovalChartData] = useState([]);
  const [visitStatusChartData, setVisitStatusChartData] = useState([]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError("");

      const [analyticsResponse, visitorsResponse] =
        await Promise.all([
          api.get("/analytics/summary"),
          api.get("/visitors"),
        ]);

      const result = analyticsResponse.data?.data;

      if (!result?.summary) {
        throw new Error("Analytics data not found.");
      }

      const summary = result.summary;

      setStats({
        total: summary.totalVisitors ?? 0,
        today: summary.registeredToday ?? 0,
        checkedIn: summary.currentlyCheckedIn ?? 0,
        pending: summary.pendingApprovals ?? 0,
        approved: summary.approvedVisitors ?? 0,
        rejected: summary.rejectedVisitors ?? 0,
        checkedOut: summary.checkedOutVisitors ?? 0,
      });

      setMonthlyData(
        (result.monthlyVisitors || []).map((item) => ({
          ...item,
          visitors: Number(item.visitors) || 0,
        }))
      );

      setApprovalChartData(
        (result.approvalDistribution || []).map((item) => ({
          name: formatLabel(item.name),
          value: Number(item.value) || 0,
        }))
      );

      setVisitStatusChartData(
        (result.visitStatusDistribution || []).map((item) => ({
          name: formatLabel(item.name),
          value: Number(item.count ?? item.value) || 0,
        }))
      );

      setVisitors(getVisitorRecords(visitorsResponse.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load visitor reports. Please check your login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Search and date filters apply to the visitor table and CSV.
  const filteredVisitors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visitors.filter((visitor) => {
      const matchesSearch = [
        visitor.name,
        visitor.company,
        visitor.phone,
        visitor.host?.name,
        visitor.hostName,
        visitor.purpose,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const dateValue = visitor.createdAt
        ? new Date(visitor.createdAt)
        : null;

      const validDate =
        dateValue && !Number.isNaN(dateValue.getTime());

      const date = validDate
        ? [
            dateValue.getFullYear(),
            String(dateValue.getMonth() + 1).padStart(2, "0"),
            String(dateValue.getDate()).padStart(2, "0"),
          ].join("-")
        : "";

      const matchesFromDate =
        !fromDate || (date && date >= fromDate);

      const matchesToDate =
        !toDate || (date && date <= toDate);

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [visitors, search, fromDate, toDate]);

  // Backend summary cards remain accurate and independent of pagination.
  const approvalColors = [
    APPROVAL_COLORS.Approved,
    APPROVAL_COLORS.Pending,
    APPROVAL_COLORS.Rejected,
  ];

  const filteredApprovalChartData = approvalChartData.filter(
    (item) => item.value > 0
  );

  const filteredVisitStatusChartData = visitStatusChartData.filter(
    (item) => item.value > 0
  );

  const visitColorFor = (name) => {
    const normalized = String(name).toLowerCase();

    if (normalized === "checked-in") {
      return VISIT_COLORS["Checked-in"];
    }

    if (normalized === "checked-out") {
      return VISIT_COLORS["Checked-out"];
    }

    return VISIT_COLORS["Not started"];
  };

  // Export filtered records to CSV.
  const exportCSV = () => {
    if (filteredVisitors.length === 0) return;

    const headers = [
      "Visitor Name",
      "Company",
      "Phone",
      "Host",
      "Purpose",
      "Registered At",
      "Appointment Date",
      "Approval Status",
      "Visit Status",
      "Check In",
      "Check Out",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredVisitors.map((visitor) => [
      visitor.name,
      visitor.company,
      visitor.phone,
      visitor.host?.name || visitor.hostName,
      visitor.purpose,
      visitor.createdAt,
      visitor.appointmentDate,
      visitor.approvalStatus,
      visitor.visitStatus,
      visitor.checkInTime,
      visitor.checkOutTime,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "visitpro-visitor-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <p className="reports-eyebrow">VISITPRO ANALYTICS</p>
          <h1>Reports &amp; Analytics</h1>
          <p>
            Monitor visitor activity and review company visit records.
          </p>
        </div>

        <div className="reports-header-actions">
          <button
            className="reports-refresh"
            onClick={fetchVisitors}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="reports-export"
            onClick={exportCSV}
            disabled={loading || filteredVisitors.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="reports-error">
          {error}
          <button onClick={fetchVisitors} disabled={loading}>
            Try again
          </button>
        </div>
      )}

      <div className="reports-filters">
        <div className="reports-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor, company, host..."
          />
        </div>

        <label>
          From
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="reports-message">Loading analytics...</div>
      ) : !error ? (
        <>
          {/* Accurate backend summary cards */}
          <div className="reports-stat-grid">
            <StatCard
              icon={<Users size={22} />}
              label="Total Visitors"
              value={stats.total}
              color="orange"
            />

            <StatCard
              icon={<BarChart3 size={22} />}
              label="Registered Today"
              value={stats.today}
              color="purple"
            />

            <StatCard
              icon={<UserCheck size={22} />}
              label="Currently Checked In"
              value={stats.checkedIn}
              color="green"
            />

            <StatCard
              icon={<Clock size={22} />}
              label="Pending Approval"
              value={stats.pending}
              color="yellow"
            />
          </div>

          {/* Backend monthly analytics and approval distribution */}
          <div className="reports-charts-grid">
            <section className="reports-chart-panel">
              <div className="reports-chart-heading">
                <div>
                  <h2>Monthly Visitor Trends</h2>
                  <p>
                    New visitor registrations over the last 6 months
                  </p>
                </div>
                <BarChart3 size={21} />
              </div>

              <div className="reports-chart-area">
                {monthlyData.length === 0 ? (
                  <div className="reports-chart-empty">
                    No monthly data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 12,
                        right: 10,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eceef2"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#777d87", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#777d87", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, "Visitors"]}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #eceef2",
                        }}
                      />
                      <Bar
                        dataKey="visitors"
                        name="Visitors"
                        fill="#F47721"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="reports-chart-panel">
              <div className="reports-chart-heading">
                <div>
                  <h2>Approval Distribution</h2>
                  <p>Visitor approval status breakdown</p>
                </div>
                <ShieldCheck size={21} />
              </div>

              <div className="reports-pie-area">
                {filteredApprovalChartData.length === 0 ? (
                  <div className="reports-chart-empty">
                    No approval data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredApprovalChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {filteredApprovalChartData.map((item) => {
                          const colorIndex = [
                            "Approved",
                            "Pending",
                            "Rejected",
                          ].indexOf(item.name);

                          return (
                            <Cell
                              key={item.name}
                              fill={approvalColors[colorIndex] || "#999"}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* Approval and visit status overview */}
          <div className="reports-panels">
            <section className="reports-panel">
              <div className="reports-panel-title">
                <h2>Approval Overview</h2>
                <ShieldCheck size={20} />
              </div>

              <StatusBar
                label="Approved"
                value={stats.approved}
                total={stats.total}
                color="green"
              />
              <StatusBar
                label="Pending"
                value={stats.pending}
                total={stats.total}
                color="yellow"
              />
              <StatusBar
                label="Rejected"
                value={stats.rejected}
                total={stats.total}
                color="red"
              />
            </section>

            <section className="reports-panel">
              <div className="reports-panel-title">
                <h2>Visit Status</h2>
                <Users size={20} />
              </div>

              <StatusBar
                label="Checked In"
                value={stats.checkedIn}
                total={stats.total}
                color="orange"
              />
              <StatusBar
                label="Checked Out"
                value={stats.checkedOut}
                total={stats.total}
                color="green"
              />
              <StatusBar
                label="Other / Not Checked In"
                value={Math.max(
                  0,
                  stats.total - stats.checkedIn - stats.checkedOut
                )}
                total={stats.total}
                color="purple"
              />
            </section>
          </div>

          {/* Visit status distribution chart from backend */}
          <section className="reports-chart-panel reports-status-chart-panel">
            <div className="reports-chart-heading">
              <div>
                <h2>Visit Status Distribution</h2>
                <p>Complete database breakdown by visit status</p>
              </div>
              <UserCheck size={21} />
            </div>

            <div className="reports-pie-area">
              {filteredVisitStatusChartData.length === 0 ? (
                <div className="reports-chart-empty">
                  No visit status data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredVisitStatusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {filteredVisitStatusChartData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={visitColorFor(item.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Visitor table */}
          <section className="reports-table-panel">
            <div className="reports-table-heading">
              <div>
                <h2>Visitor Report</h2>
                <p>
                  {filteredVisitors.length} records returned by the visitor API
                  match your filters
                </p>
              </div>
            </div>

            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Company</th>
                    <th>Host</th>
                    <th>Registered</th>
                    <th>Approval</th>
                    <th>Visit Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor._id}>
                      <td>
                        <strong>{visitor.name || "—"}</strong>
                        <small>{visitor.phone || ""}</small>
                      </td>
                      <td>{visitor.company || "—"}</td>
                      <td>
                        {visitor.host?.name || visitor.hostName || "—"}
                      </td>
                      <td>
                        {visitor.createdAt
                          ? new Date(
                              visitor.createdAt
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`report-badge report-${String(
                            visitor.approvalStatus || "pending"
                          ).toLowerCase()}`}
                        >
                          {visitor.approvalStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <span className="report-visit-status">
                          {visitor.visitStatus || "not started"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVisitors.length === 0 && (
                <div className="reports-empty">
                  No visitor records match these filters.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="reports-stat-card">
      <div className={`reports-stat-icon ${color}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{Number(value || 0).toLocaleString("en-IN")}</h2>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="reports-status-row">
      <div className="reports-status-info">
        <span>{label}</span>
        <strong>
          {value} <small>({percentage}%)</small>
        </strong>
      </div>
      <div className="reports-progress-track">
        <div
          className={`reports-progress-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
