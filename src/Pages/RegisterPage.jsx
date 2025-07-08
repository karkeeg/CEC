import React, { useState } from "react";
import bcrypt from "bcryptjs";
import supabase from "../supabaseConfig/supabaseClient";

const Register = () => {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    reg_no: "",
    first_name: "",
    middle_name: "",
    last_name: "",
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

    const { reg_no, first_name, middle_name, last_name, email, password } =
      form;

    if (!reg_no || !first_name || !last_name || !email || !password) {
      setMsg("Please fill all required fields.");
      setLoading(false);
      return;
    }

    try {
      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Determine table
      const table =
        role === "admin"
          ? "admins"
          : role === "teacher"
          ? "teachers"
          : "students";

      // Prepare data to insert
      const dataToInsert = {
        reg_no,
        first_name,
        middle_name,
        last_name,
        email,
        hashed_password: hashedPassword,
      };

      const { error } = await supabase.from(table).insert([dataToInsert]);

      if (error) {
        console.error("Insert error:", error);
        setMsg("Registration failed: " + error.message);
      } else {
        setMsg(`Successfully registered as ${role}`);
        setForm({
          reg_no: "",
          first_name: "",
          middle_name: "",
          last_name: "",
          email: "",
          password: "",
        });
      }
    } catch (err) {
      console.error("Hashing error:", err);
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
          name="reg_no"
          type="text"
          placeholder="Registration Number"
          value={form.reg_no}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
        <input
          name="first_name"
          type="text"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
        <input
          name="middle_name"
          type="text"
          placeholder="Middle Name (optional)"
          value={form.middle_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
        />
        <input
          name="last_name"
          type="text"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
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

export default Register;
