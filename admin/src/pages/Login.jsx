import React, { useState } from "react";
import { useContextApi } from "../hooks/useContextApi";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const { loginuser } = useContextApi();
  const navigate = useNavigate();

  // 🔥 Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔥 Submit Login Form
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await loginuser(formData);

      console.log("message", response.data.token);

      if (response?.data?.token) {
        // Save tokens
        localStorage.setItem("adminToken", response.data?.token);
        localStorage.setItem("adminRefreshToken", response.data?.token);
        

        navigate("/");
      } else {
        setErrorMsg("Invalid email or password");
      }
    } catch (error) {
      console.log("Login error:", error);
      setErrorMsg("Something went wrong. Try again.");
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-8 border border-gray-100">

        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Admin Panel
        </h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          Sign in to continue
        </p>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-red-600 text-center mb-3 text-sm">{errorMsg}</p>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Admin Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none
              focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none
              focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold
            hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Cafrox Admin. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
