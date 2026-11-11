import { Link } from "react-router-dom";
import { Tile } from "./ui";

export default function ProductCard({ p }) {
  return (
    <Link to={`/product/${p.id}`} className="stitch p-3 block hover:border-lav-600 transition-colors">
      <Tile image={p.image} category={p.category} />
      <div className="px-1 pt-3">
        <p className="text-xs font-semibold text-rose-600">{p.category}</p>
        <h3 className="text-lg font-bold leading-snug">{p.name}</h3>
        <p className="text-sm text-plum/70">by {p.creator_name}</p>
        <p className="mt-1 font-bold">₹{p.price}</p>
      </div>
    </Link>
  );
}
