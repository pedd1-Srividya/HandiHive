
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, Flower2, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isCustomer,
    isCreator,
    isAdmin,
    logout,
  } = useAuth();

  const cls = ({ isActive }) =>
    `px-3 py-2 rounded-full font-semibold ${
      isActive
        ? "bg-lav-100 text-lav-600"
        : "hover:bg-rose-100"
    }`;

  const links = [];

  if (!isAdmin) {
    links.push(
      ["/", "Shop"],
      ["/materials", "Materials"]
    );
  }

    if (isCustomer) {
    links.push(
      ["/custom-order", "Custom Order"],
      ["/ai-custom-design", "AI Design Assistant"],
      ["/virtual-try-on", "Virtual Try-On"],
      ["/my-orders", "My Orders"],
      ["/wishlist", "♥ Wishlist"],
      ["/cart", "Cart"],
      ["/my-purchases", "My Purchases"],
      ["/chat", "Chat"],
      ["/my-material-orders", "Material Orders"]
    );
  }

  if (isCreator) {
    links.push(
      ["/dashboard", "Creator Dashboard"],
      ["/chat", "💬 Chat"],
      ["/my-material-orders", "Material Orders"]
    );
  }

  if (isAdmin) {
    links.push(
      ["/admin", "Admin Dashboard"]
    );
  }

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-lav-300">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-2xl font-bold"
          onClick={() => setOpen(false)}
        >
          <Flower2 className="text-rose-600" />
          HandiHive
        </Link>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        <div
          className={`${
            open ? "flex" : "hidden"
          } md:flex absolute md:static top-full left-0 right-0 flex-col md:flex-row bg-cream md:bg-transparent p-4 md:p-0 gap-1`}
        >
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={cls}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={cls}
                onClick={() => setOpen(false)}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={cls}
                onClick={() => setOpen(false)}
              >
                Register
              </NavLink>
            </>
          ) : (
            <>
              <span className="px-3 py-2 font-semibold text-plum">
                Hi, {user?.name}
              </span>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-full font-semibold hover:bg-rose-100 flex items-center gap-2"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
