"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  
  // Form state
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [newUsername, setNewUsername] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  
  // Messages UI state
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [viewingMessageIndex, setViewingMessageIndex] = useState<number | null>(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setNewUsername(data.user.username);
          // Fetch user data
          const dataRes = await fetch("/api/life-data");
          if (dataRes.ok) {
            const lifeData = await dataRes.json();
            if (lifeData.dateOfBirth) {
              const [y, m] = lifeData.dateOfBirth.split('-');
              setBirthYear(y);
              setBirthMonth(String(parseInt(m)));
            }
            if (lifeData.messages) {
              setMessages(lifeData.messages);
            }
          }
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch {
      console.error("Logout failed");
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    // Build dateOfBirth (day defaults to 01)
    let dateOfBirth: string | null = null;
    if (birthYear && birthMonth) {
      const y = parseInt(birthYear);
      const m = parseInt(birthMonth);
      if (!isNaN(y) && !isNaN(m) && y > 1900 && y <= new Date().getFullYear() && m >= 1 && m <= 12) {
        dateOfBirth = `${y}-${String(m).padStart(2, '0')}-01`;
      }
    }

    try {
      const res = await fetch("/api/life-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth,
          messages,
        }),
      });

      if (res.ok) {
        setSaveMessage("Settings saved!");
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        setSaveMessage("Failed to save");
      }
    } catch {
      setSaveMessage("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, newMessage.trim()]);
      setNewMessage("");
      setShowMessageInput(false);
    }
  };

  const handleDeleteMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
    setViewingMessageIndex(null);
  };

  const handleUsernameChange = async () => {
    if (!newUsername || newUsername === user?.username) return;
    
    // Validate username
    if (newUsername.length < 1 || newUsername.length > 30) {
      setUsernameError("Username must be between 1 and 30 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setUsernameError(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSaveMessage("Username updated!");
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        const data = await res.json();
        setUsernameError(data.error || "Failed to update username");
      }
    } catch {
      setUsernameError("Failed to update username");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      const res = await fetch("/api/auth/delete", {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to delete account");
      }
    } catch {
      alert("Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              Your Life in Months
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">Settings</span>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Save message */}
        {saveMessage && (
          <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm">
            {saveMessage}
          </div>
        )}

        {/* Username Section */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Username</h2>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">@</span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value.toLowerCase());
                setUsernameError(null);
              }}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
              placeholder="username"
            />
            <button
              onClick={handleUsernameChange}
              disabled={isSaving || newUsername === user.username}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Update
            </button>
          </div>
          {usernameError && (
            <p className="mt-1 text-xs text-red-600">{usernameError}</p>
          )}
        </section>

        {/* Date of Birth Section */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Date of Birth</h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="Year"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            />
            <span className="text-gray-400">/</span>
            <input
              type="number"
              min="1"
              max="12"
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              placeholder="Month"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            />
          </div>
        </section>

        {/* Messages Section */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Messages</h2>
          <p className="text-xs text-gray-500 mb-2">Add messages to display on your homepage. One will be shown randomly on each visit.</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Numbered message buttons */}
            {messages.map((_, index) => (
              <button
                key={index}
                onClick={() => setViewingMessageIndex(viewingMessageIndex === index ? null : index)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  viewingMessageIndex === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            {/* Add button */}
            <button
              onClick={() => setShowMessageInput(true)}
              className="w-8 h-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg font-medium flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Message input modal */}
          {showMessageInput && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowMessageInput(false);
                    setNewMessage("");
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* View message */}
          {viewingMessageIndex !== null && messages[viewingMessageIndex] && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{messages[viewingMessageIndex]}</p>
              <button
                onClick={() => handleDeleteMessage(viewingMessageIndex)}
                className="mt-2 px-3 py-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </section>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {/* Account Actions */}
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              Logout
            </button>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
              >
                Delete Account
              </button>
            ) : (
              <div className="w-full mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 mb-2">
                  This action cannot be undone. Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-2 py-1.5 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE"}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Delete My Account
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
