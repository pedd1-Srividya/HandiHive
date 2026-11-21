
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "creator") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-lav-600 mb-2">
        Welcome Back!
      </h1>

      <p className="text-center text-plum/70 mb-6">
        Login to your HandiHive account
      </p>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lav-300"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Password
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lav-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-lav-600 text-white font-bold py-3 rounded-lg hover:bg-lav-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-lav-600 font-bold hover:underline"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}
