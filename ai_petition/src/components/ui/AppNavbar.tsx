import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "@/components/auth/AuthContext";
import axios from "axios";
import { ThemeToggle } from "../theme/theme-provider";

interface UserInfo {
  role: string;
  name?: string;
  email?: string;
}

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const getUserInfo = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = response.data.user
      return data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = await getUserInfo();
      setUserInfo(userInfo);
    };
    fetchUser();
  }, []);

  // Add scroll event listener to change navbar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (profileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white text-gray-800 shadow-lg dark:bg-background-300 dark:text-white"
          : "bg-indigo-600 text-white "
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/"
            className={`text-2xl font-bold flex items-center transition-colors ${
              isScrolled ? "text-indigo-600 dark:text-white" : "text-white"
            }`}
          >
            <span className="inline-block mr-2">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                ></path>
              </svg>
            </span>
            Grievance App
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <ul className="flex space-x-1 items-center">
              
              <li>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? isScrolled
                        ? "bg-indigo-100 text-indigo-700 dark:bg-background-300 dark:text-foreground"
                        : "bg-indigo-700 text-white"
                      : isScrolled
                      ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:bg-background-300 dark:text-foreground"
                      : "text-white hover:bg-indigo-700"
                  }`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/grievances"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/grievances")
                      ? isScrolled
                        ? "bg-indigo-100 text-indigo-700 dark:bg-background-300 dark:text-foreground"
                        : "bg-indigo-700 text-white"
                      : isScrolled
                      ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:bg-background-300 dark:text-foreground"
                      : "text-white hover:bg-indigo-700"
                  }`}
                >
                  Grievances
                </Link>
              </li>
              <li>
                <Link
                  to="/chatbot"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/chatbot")
                      ? isScrolled
                        ? "bg-indigo-100 text-indigo-700 dark:bg-background-300 dark:text-foreground"
                        : "bg-indigo-700 text-white"
                      : isScrolled
                      ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:bg-background-300 dark:text-foreground"
                      : "text-white hover:bg-indigo-700"
                  }`}
                >
                  Chatbot
                </Link>
              </li>
              <li>
                <Link
                  to="/feedback"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/chatbot")
                      ? isScrolled
                        ? "bg-indigo-100 text-indigo-700 dark:bg-background-300 dark:text-foreground"
                        : "bg-indigo-700 text-white"
                      : isScrolled
                      ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:bg-background-300 dark:text-foreground"
                      : "text-white hover:bg-indigo-700"
                  }`}
                >
                  Feedback
                </Link>
              </li>
              <li className="flex items-center">
                <ThemeToggle />
              </li>
            </ul>

            {/* User Profile Dropdown */}
            <div className="relative ml-3 profile-dropdown-container">
              <button
                onClick={toggleProfileDropdown}
                className={`flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isScrolled
                    ? "focus:ring-indigo-500 text-gray-700 dark:bg-background-300 dark:text-foreground"
                    : "focus:ring-white text-white"
                }`}
              >
                <span className="sr-only">Open user menu</span>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isScrolled ? "bg-indigo-100 text-indigo-600 dark:bg-background-100 dark:text-foreground" : "bg-indigo-500 text-white"
                  }`}
                >
                  <FaUser className="h-4 w-4" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    isScrolled ? "text-gray-700 dark:bg-background-300 dark:text-foreground" : "text-white"
                  }`}
                >
                  {userInfo?.name || "User"}
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <FaSignOutAlt className="mr-2" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isScrolled
                ? "focus:ring-indigo-500 text-gray-700"
                : "focus:ring-white text-white"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {menuOpen ? (
              <FaTimes className="block h-6 w-6" />
            ) : (
              <FaBars className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className={`md:hidden ${
            isScrolled ? "bg-white" : "bg-indigo-700"
          } transition-all duration-300 ease-in-out`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/dashboard")
                  ? isScrolled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-600 text-white"
                  : isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/grievances"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/grievances")
                  ? isScrolled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-600 text-white"
                  : isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              Grievances
            </Link>
            <Link
              to="/chatbot"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/chatbot")
                  ? isScrolled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-600 text-white"
                  : isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              Chatbot
            </Link>
            <Link
              to="/feedback"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/chatbot")
                  ? isScrolled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-600 text-white"
                  : isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              Feedback
            </Link>
            {userInfo?.role === "labour" && (
              <Link
                to="/jobs"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/jobs")
                    ? isScrolled
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-indigo-600 text-white"
                    : isScrolled
                    ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                    : "text-white hover:bg-indigo-600"
                }`}
              >
                Jobs
              </Link>
            )}
            {userInfo?.role === "contractor" && (
              <Link
                to="/employees"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/employees")
                    ? isScrolled
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-indigo-600 text-white"
                    : isScrolled
                    ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                    : "text-white hover:bg-indigo-600"
                }`}
              >
                Employees
              </Link>
            )}
            {userInfo?.role === "ngo" && (
              <Link
                to="/services"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/services")
                    ? isScrolled
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-indigo-600 text-white"
                    : isScrolled
                    ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                    : "text-white hover:bg-indigo-600"
                }`}
              >
                Services
              </Link>
            )}
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/profile")
                  ? isScrolled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-indigo-600 text-white"
                  : isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                isScrolled
                  ? "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  : "text-white hover:bg-indigo-600"
              }`}
            >
              <div className="flex items-center">
                <FaSignOutAlt className="mr-2" />
                Sign out
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;