// Register.jsx
import React, { useState } from "react";
import supabase from "../supabaseConfig/supabaseClient";

const RegisterPage = () => {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { email, password } = form;

    if (!email || !password) {
      setMsg("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) {
        setMsg("Signup failed: " + error.message);
      } else {
        setMsg("Signup successful! Check your email to confirm your account.");
        setForm({ email: "", password: "" });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setMsg("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-cyan-500">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl p-8 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">
          Register
        </h2>

        {msg && <p className="text-center text-sm text-red-600">{msg}</p>}

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
