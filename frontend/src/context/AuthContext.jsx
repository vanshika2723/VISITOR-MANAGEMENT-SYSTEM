
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import api from "../services/api";

const AuthContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem("visitor_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      sessionStorage.removeItem("visitor_user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // ===============================
  // VERIFY USER SESSION
  // ===============================
  useEffect(() => {
    const verifySession = async () => {
      const token = sessionStorage.getItem("visitor_token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data.user;

        setUser(currentUser);

        sessionStorage.setItem(
          "visitor_user",
          JSON.stringify(currentUser)
        );
      } catch (error) {
        sessionStorage.removeItem("visitor_token");
        sessionStorage.removeItem("visitor_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // ===============================
  // SOCKET.IO CONNECTION
  // ===============================
  useEffect(() => {
    const token = sessionStorage.getItem("visitor_token");

    if (!user || !token) {
      setSocket(null);
      return;
    }

    const socketConnection = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketConnection.on("connect", () => {
      console.log("VisitPro Socket Connected:", socketConnection.id);
    });

    socketConnection.on("connect_error", (error) => {
      console.error("Socket Connection Error:", error.message);
    });

    socketConnection.on("disconnect", (reason) => {
      console.log("VisitPro Socket Disconnected:", reason);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      setSocket(null);
    };
  }, [user]);

  // ===============================
  // LOGIN
  // ===============================
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user: loggedInUser } = response.data;

    sessionStorage.setItem("visitor_token", token);

    sessionStorage.setItem(
      "visitor_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  // ===============================
  // LOGOUT
  // ===============================
  const logout = async () => {
    sessionStorage.removeItem("visitor_token");
    sessionStorage.removeItem("visitor_user");

    setUser(null);
  };

  const value = {
    user,
    loading,
    socket,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================
// CUSTOM AUTH HOOK
// ===============================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
