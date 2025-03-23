/* eslint-disable react-refresh/only-export-components */
// src/components/auth/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";


// Define AuthContext properties
interface AuthContextType {
  user: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true
});

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("user");
        setUser(userId);
      } catch (error) {
        console.error("Error fetching user:", error);
      } 
    };
    setIsLoading(true);
    fetchUser();
    setIsLoading(false);
  }, []);
  

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Create context value
  const value = {
    user,
    setUser,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
