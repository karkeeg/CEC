import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { FaUserCircle, FaSave, FaTimes, FaLock } from "react-icons/fa";
import supabase from "../supabaseConfig/supabaseClient";

const Settings = () => {
  const { user, profile, signOut } = useUser();
  const [form, setForm] = useState({
    display_name: user?.user_metadata?.display_name || "",
    email: user?.email || "",
    phone: user?.user_metadata?.Phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Fetch latest profile data from Auth on mount
  useEffect(() => {
    if (!user) return;
    setForm({
      display_name: user.user_metadata?.display_name || "",
      email: user.email || "",
      phone: user.user_metadata?.Phone || "",
    });
    // eslint-disable-next-line
  }, [user]);

  // Save profile changes to Auth
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: form.display_name,
        Phone: form.phone,
      },
    });
    if (error) {
      setError("Failed to update profile.");
    } else {
      setSuccess("Profile updated successfully.");
    }
    setLoading(false);
  };

  // Save password changes
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (passwords.new !== passwords.confirm) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: passwords.new,
    });
    if (error) {
      setError(error.message || "Failed to update password.");
    } else {
      setSuccess("Password updated successfully.");
      setPasswords({ current: "", new: "", confirm: "" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen ml-64 p-8 bg-slate-50">
      <h1 className="text-3xl font-bold mb-8 text-[#1b3e94]">Settings</h1>
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="rounded-full bg-blue-100 p-4 shadow-lg mb-2 flex items-center justify-center">
              <FaUserCircle size={64} className="text-blue-600" />
            </div>
            <div className="text-xl font-semibold text-gray-800">
              {form.display_name}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {user?.user_metadata?.role?.toUpperCase() || "USER"}
          </div>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={form.display_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_name: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={form.email}
                disabled
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border rounded px-3 py-2"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              <FaSave /> Save
            </button>
            <button
              type="button"
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
      {/* Change Password Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaLock /> Change Password
        </h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Current Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded px-3 py-2"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded px-3 py-2"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded px-3 py-2"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword((v) => !v)}
              />{" "}
              Show Passwords
            </label>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              <FaSave /> Save Password
            </button>
          </div>
        </form>
      </div>
      {/* Preferences Section (optional) */}
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="flex gap-8">
          <div>
            <label className="block text-sm font-medium mb-1">Theme</label>
            <select className="border rounded px-3 py-2">
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Notifications
            </label>
            <select className="border rounded px-3 py-2">
              <option>All</option>
              <option>Email Only</option>
              <option>None</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
