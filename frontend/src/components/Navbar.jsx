import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, Flower2 } from "lucide-react";

const links = [["/", "Shop"], ["/materials", "Materials"], ["/custom-order", "Custom order"], ["/my-orders", "My orders"], ["/dashboard", "Creator dashboard"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const cls = ({ isActive }) => `px-3 py-2 rounded-full font-semibold ${isActive ? "bg-lav-100 text-lav-600" : "hover:bg-rose-100"}`;
  return (
    <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-lav-300">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
          <Flower2 className="text-rose-600" /> HandiHive
        </Link>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
        <div className={`${open ? "flex" : "hidden"} md:flex absolute md:static top-full left-0 right-0 flex-col md:flex-row bg-cream md:bg-transparent p-4 md:p-0 gap-1`}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={cls} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
