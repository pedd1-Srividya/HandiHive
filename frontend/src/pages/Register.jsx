
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const { registerCustomer, registerCreator } = useAuth();

  const [role, setRole] = useState("customer");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    specialty: "",
    location: "",
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
      if (role === "customer") {
        await registerCustomer({
          name: form.name,
          email: form.email,
          password: form.password,
        });

        navigate("/");
      } else {
        await registerCreator({
          name: form.name,
          email: form.email,
          password: form.password,
          bio: form.bio,
          specialty: form.specialty,
          location: form.location,
        });

        navigate("/dashboard");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-lav-600 mb-2">
        Join HandiHive
      </h1>

      <p className="text-center text-plum/70 mb-6">
        Create your account and become part of our handmade community.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`p-3 rounded-lg font-bold border ${
            role === "customer"
              ? "bg-lav-600 text-white border-lav-600"
              : "bg-white text-plum border-lav-300"
          }`}
        >
          Customer
        </button>

        <button
          type="button"
          onClick={() => setRole("creator")}
          className={`p-3 rounded-lg font-bold border ${
            role === "creator"
              ? "bg-lav-600 text-white border-lav-600"
              : "bg-white text-plum border-lav-300"
          }`}
        >
          Creator
        </button>
      </div>

      <div className="bg-rose-50 rounded-lg p-3 mb-6 text-sm text-plum">
        {role === "customer"
          ? "Create a customer account to explore handmade products and place custom orders."
          : "Create a creator account to showcase your handmade products and manage customer orders."}
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">
            Full Name
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
            minLength={2}
            maxLength={100}
            required
            className="w-full border rounded-lg p-3"
          />
        </div>

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
            className="w-full border rounded-lg p-3"
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
            placeholder="Minimum 8 characters"
            minLength={8}
            maxLength={128}
            required
            className="w-full border rounded-lg p-3"
          />
        </div>

        {role === "creator" && (
          <>
            <div>
              <label className="block font-semibold mb-1">
                About Your Work
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell customers about your handmade creations"
                className="w-full border rounded-lg p-3"
                rows={3}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Specialty
              </label>

              <input
                type="text"
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                placeholder="Crochet, Jewellery, Painting, etc."
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Your city"
                className="w-full border rounded-lg p-3"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-lav-600 text-white font-bold py-3 rounded-lg hover:bg-lav-700 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-lav-600 font-bold hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
