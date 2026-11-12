
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  CircleCheck,
  AlertCircle,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
} from "lucide-react";
import api from "../services/api";


const getNotificationIcon = (type) => {
  switch (type) {
    case "approval_request":
    case "visitor_registration":
      return Bell;
    case "approval_approved":
      return UserCheck;
    case "approval_rejected":
      return UserX;
    case "visitor_checkin":
      return LogIn;
    case "visitor_checkout":
      return LogOut;
    case "security":
      return AlertCircle;
    default:
      return CircleCheck;
  }
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        `/notifications?page=${page}&limit=20`
      );

      const data = response.data;

      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
      setPages(Math.max(1, Number(data.pages || 1)));
    } catch (err) {
      console.error("Notifications loading failed:", err);

      setError(
        err.response?.data?.message ||
          "Notifications load nahi ho paayi. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.isRead) ||
        (filter === "read" && notification.isRead);

      const matchesSearch =
        !query ||
        `${notification.title || ""} ${notification.message || ""} ${
          notification.visitor?.name || ""
        } ${notification.visitor?.visitorId || ""}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  const handleMarkRead = async (id) => {
    const target = notifications.find((item) => item._id === id);

    if (!target || target.isRead) return;

    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item._id === id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Mark as read failed:", err);
      setError("Notification ko read mark nahi kar paaye.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read failed:", err);
      setError("Notifications ko read mark nahi kar paaye.");
    }
  };

  const handleDelete = async (id) => {
    const target = notifications.find((item) => item._id === id);

    try {
      await api.delete(`/notifications/${id}`);

      setNotifications((current) =>
        current.filter((item) => item._id !== id)
      );

      if (target && !target.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      if (notifications.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (err) {
      console.error("Delete notification failed:", err);
      setError("Notification delete nahi ho paayi.");
    }
  };

  const handleOpenNotification = async (notification) => {
    await handleMarkRead(notification._id);

    if (notification.actionUrl) {
      window.location.assign(notification.actionUrl);
    }
  };

  const unreadOnPage = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="notifications-page">
      <div className="notifications-heading">
        <div>
          <span className="notifications-eyebrow">VISITPRO CENTER</span>
          <h1>Notifications</h1>
          <p>Stay updated with visitor activity and approvals.</p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={() => fetchNotifications(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="notifications-stats">
        <div className="notification-stat-card">
          <div className="notification-stat-icon orange">
            <Bell size={21} />
          </div>
          <div>
            <span>Total on this page</span>
            <strong>{notifications.length}</strong>
          </div>
        </div>

        <div className="notification-stat-card">
          <div className="notification-stat-icon red">
            <AlertCircle size={21} />
          </div>
          <div>
            <span>Unread notifications</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notification-stat-card">
          <div className="notification-stat-icon green">
            <CheckCheck size={21} />
          </div>
          <div>
            <span>Read on this page</span>
            <strong>{notifications.length - unreadOnPage}</strong>
          </div>
        </div>
      </div>

      <div className="notifications-toolbar">
        <div className="notifications-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="notifications-filters">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "read", label: "Read" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="notifications-mark-all"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={16} />
          Mark all read
        </button>
      </div>

      {error && (
        <div className="notifications-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <div className="notifications-list-card">
        <div className="notifications-list-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Your latest visitor and system updates</p>
          </div>
          <span className="notifications-result-count">
            {filteredNotifications.length} shown
          </span>
        </div>

        {loading ? (
          <div className="notifications-state">
            <RefreshCw size={25} className="refresh-spinning" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-state">
            <div className="notifications-empty-icon">
              <Bell size={27} />
            </div>
            <h3>No notifications found</h3>
            <p>
              {search || filter !== "all"
                ? "Try changing your search or filter."
                : "New visitor updates will appear here."}
            </p>
            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <article
                  key={notification._id}
                  className={`notification-row ${
                    notification.isRead ? "is-read" : "is-unread"
                  }`}
                >
                  <div className="notification-row-icon">
                    <Icon size={21} />
                  </div>

                  <div className="notification-row-content">
                    <div className="notification-row-title">
                      <h3>{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="notification-unread-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    {notification.visitor && (
                      <span className="notification-visitor-ref">
                        {notification.visitor.name || "Visitor"}
                        {notification.visitor.visitorId
                          ? ` · ${notification.visitor.visitorId}`
                          : ""}
                      </span>
                    )}

                    <span className="notification-row-time">
                      <Clock size={13} />
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  <div className="notification-row-actions">
                    {notification.actionUrl && (
                      <button
                        type="button"
                        className="notification-open-btn"
                        onClick={() => handleOpenNotification(notification)}
                      >
                        View
                      </button>
                    )}

                    {!notification.isRead && (
                      <button
                        type="button"
                        className="notification-action-btn"
                        title="Mark as read"
                        aria-label="Mark as read"
                        onClick={() => handleMarkRead(notification._id)}
                      >
                        <Check size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="notification-action-btn delete"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() => handleDelete(notification._id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && pages > 1 && (
          <div className="notifications-pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {pages}
            </span>

            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
