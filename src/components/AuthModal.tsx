"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

import { CellDataMap } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pre-fill values from guest session
  initialDateOfBirth?: string;
  initialCellData?: CellDataMap;
}

export function AuthModal({ 
  isOpen, 
  onClose,
  initialDateOfBirth,
  initialCellData
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // DOB for signup (year and month only, day defaults to 1)
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  // Pre-fill from guest session when opening
  useEffect(() => {
    if (isOpen && initialDateOfBirth) {
      const [y, m] = initialDateOfBirth.split('-');
      setBirthYear(y || "");
      setBirthMonth(m ? String(parseInt(m)) : "");
    }
  }, [isOpen, initialDateOfBirth]);

  if (!isOpen) return null;

  // Compute full date of birth string (day defaults to 01)
  const getDateOfBirth = () => {
    if (birthYear && birthMonth) {
      const y = parseInt(birthYear);
      const m = parseInt(birthMonth);
      if (!isNaN(y) && !isNaN(m) && y > 1900 && y <= new Date().getFullYear() && m >= 1 && m <= 12) {
        return `${y}-${String(m).padStart(2, '0')}-01`;
      }
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        const dob = getDateOfBirth();
        await signup(username, password, dob);
        
        // After signup, save the guest's cellData if any
        if (initialCellData && Object.keys(initialCellData).length > 0) {
          await fetch("/api/life-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cellData: initialCellData }),
          });
        }
      }
      onClose();
      // Force page reload to refresh all data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
  };

  const switchToSignup = () => {
    setMode("signup");
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {mode === "login" ? "Login" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Date of birth for signup */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="Year"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    placeholder="Month"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={switchToSignup}
                className="text-blue-600 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={switchToLogin}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
