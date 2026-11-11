import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api, { errMsg } from "../services/api";
import { PRODUCT_CATEGORIES } from "../services/constants";
import ProductCard from "../components/ProductCard";
import { Empty, Message } from "../components/ui";

export default function Shop() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get("/products", { params: { q: q || undefined, category: category || undefined } })
        .then((r) => { setItems(r.data); setError(""); })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, category]);

  return (
    <div className="space-y-6">
      <section className="stitch p-6 md:p-10 bg-gradient-to-br from-lav-100 to-rose-100">
        <h1 className="text-3xl md:text-5xl font-bold max-w-2xl">Things made by hand, by someone you can message.</h1>
        <p className="mt-3 max-w-xl text-plum/80">Browse finished pieces, or ask a creator to make something just for you.</p>
        <div className="relative mt-5 max-w-lg">
          <Search className="absolute left-3 top-2.5 text-lav-600" size={20} />
          <input className="input pl-10" placeholder="Search crochet, bracelets, gifts…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {["", ...PRODUCT_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${category === c ? "bg-plum text-cream border-plum" : "border-lav-300 bg-white hover:bg-lav-100"}`}>
            {c || "All"}
          </button>
        ))}
      </div>
      <Message>{error}</Message>
      {loading ? <p>Loading…</p> : items.length === 0 ? <Empty>No products match. Try another search or category.</Empty> : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
