import { EMOJI } from "../services/constants";

// Picture tile: shows the image URL if given, otherwise a category emoji
export function Tile({ image, category, className = "h-40" }) {
  return image ? (
    <img src={image} alt="" className={`w-full object-cover rounded-xl ${className}`} />
  ) : (
    <div className={`w-full rounded-xl bg-gradient-to-br from-lav-100 to-rose-100 flex items-center justify-center text-5xl ${className}`} aria-hidden="true">
      {EMOJI[category] || "✨"}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

export function Message({ type = "error", children }) {
  if (!children) return null;
  const c = type === "error" ? "bg-rose-100 text-rose-600" : "bg-lav-100 text-lav-600";
  return <p role="alert" className={`rounded-xl px-4 py-2 text-sm font-semibold ${c}`}>{children}</p>;
}

export const Empty = ({ children }) => <p className="stitch p-8 text-center text-plum/70">{children}</p>;

const STATUS_COLOURS = { Pending: "bg-amber-100 text-amber-800", Accepted: "bg-lav-100 text-lav-600", Rejected: "bg-rose-100 text-rose-600", "In Progress": "bg-sky-100 text-sky-800", Completed: "bg-emerald-100 text-emerald-800" };
export const StatusBadge = ({ status }) => <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOURS[status] || ""}`}>{status}</span>;
