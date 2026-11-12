
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/visitors": "Visitor Management",
  "/visitors/add": "Register Visitor",
  "/appointments": "Appointments",
  "/employees": "Employee Management",
  "/blacklist": "Blacklist Management",
  "/reports": "Reports & Analytics",
  "/notifications": "Notifications",
  "/settings": "System Settings",
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
const { user, socket } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const dropdownRef = useRef(null);

  const title = pageTitles[location.pathname] || "VisitPro";

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      setNotificationError("");

      const response = await api.get("/notifications?limit=10");
      const data = response.data;

      setNotifications(data.notifications || []);
      setUnreadCount(
        Number(data.unreadCount ?? 0)
      );
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotificationError(
        error.response?.data?.message ||
          "Notifications could not be loaded."
      );
    } finally {
      setLoadingNotifications(false);
    }
  };
// ===============================
// REAL-TIME NOTIFICATIONS
// ===============================
useEffect(() => {
  if (!socket) return;

  const handleNewNotification = (newNotification) => {
    console.log("New notification received:", newNotification);

    setNotifications((current) => {
      // Prevent duplicate notifications
      const alreadyExists = current.some(
        (item) => item._id === newNotification._id
      );

      if (alreadyExists) return current;

      return [newNotification, ...current].slice(0, 10);
    });

    if (!newNotification.isRead) {
      setUnreadCount((count) => count + 1);
    }
  };

  socket.on("newNotification", handleNewNotification);

  return () => {
    socket.off("newNotification", handleNewNotification);
  };
}, [socket]);
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [showNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      await api.delete(`/notifications/${notificationId}`);

      setNotifications((current) =>
        current.filter((item) => item._id !== notificationId)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    setShowNotifications(false);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate("/notifications");
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1>{title}</h1>
          <p>Welcome back, {user?.name || "User"}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          <CalendarDays size={17} />
          <span>{today}</span>
        </div>

        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className="topbar-icon-button notification-bell"
            type="button"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={showNotifications}
            onClick={() => {
              setShowNotifications((current) => !current);

              if (!showNotifications) {
                loadNotifications();
              }
            }}
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <h3>Notifications</h3>
                  <p>{unreadCount} unread</p>
                </div>

                <button
                  type="button"
                  className="notification-close"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-mark-all"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>
              )}

              <div className="notification-list">
                {loadingNotifications ? (
                  <p className="notification-empty">
                    Loading notifications...
                  </p>
                ) : notificationError ? (
                  <p className="notification-empty">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="notification-empty">
                    You’re all caught up!
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${
                        notification.isRead ? "read" : "unread"
                      }`}
                    >
                      <button
                        type="button"
                        className="notification-content"
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >
                        <span className="notification-item-title">
                          {notification.title}
                        </span>

                        <span className="notification-message">
                          {notification.message}
                        </span>

                        <span className="notification-time">
                          {new Date(
                            notification.createdAt
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </button>

                      <div className="notification-item-actions">
                        {!notification.isRead && (
                          <button
                            type="button"
                            title="Mark as read"
                            aria-label="Mark as read"
                            onClick={() =>
                              handleMarkAsRead(notification._id)
                            }
                          >
                            <Check size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete notification"
                          aria-label="Delete notification"
                          onClick={() =>
                            handleDeleteNotification(notification._id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="notification-view-all"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifications");
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="topbar-profile">
          <div className="topbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="topbar-profile-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "Employee"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
