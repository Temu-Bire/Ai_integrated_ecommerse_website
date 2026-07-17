import React, { useState } from "react";
import { Cpu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import mockUsers from "../data/mockUsers"; // Import mock users

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle login
  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    // Find matching user
    const user = mockUsers.find(
      (user) =>
        user.email === formData.email &&
        user.password === formData.password
    );

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    // Save logged in user
    localStorage.setItem("user", JSON.stringify(user));

    // Redirect based on role
    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-white mt-4">
            Welcome Back
          </h2>

          <p className="text-slate-500 text-sm mt-2 text-center">
            Sign in to your account.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 py-3 font-bold text-slate-900 transition hover:bg-cyan-400"
          >
            Sign In
          </button>

        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-cyan-400 hover:underline"
          >
            Register
          </Link>
        </p>

        {/* Demo Accounts */}
        <div className="mt-8 border-t border-slate-800 pt-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-400">
            Demo Accounts
          </h3>

          <div className="space-y-3 text-xs text-slate-500">
            {mockUsers.map((user) => (
              <div key={user.id}>
                <p>
                  <strong className="text-cyan-400">
                    {user.role.toUpperCase()}
                  </strong>
                </p>
                <p>Email: {user.email}</p>
                <p>Password: {user.password}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}