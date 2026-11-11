import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";
import { MATERIAL_CATEGORIES } from "../services/constants";
import { Tile, Message, Empty } from "../components/ui";

export default function Materials() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/materials", { params: { q: q || undefined, category: category || undefined } })
      .then((r) => { setItems(r.data); setError(""); }).catch((e) => setError(errMsg(e)));
  }, [q, category]);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Craft materials</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search materials" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search materials" />
        <select className="input max-w-xs" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Material category">
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <Message>{error}</Message>
      {items.length === 0 ? <Empty>No materials found.</Empty> : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="stitch p-3">
              <Tile image={m.image} category={m.category} className="h-32" />
              <h3 className="mt-3 font-bold">{m.name}</h3>
              <p className="text-sm text-plum/70">{m.description}</p>
              <p className="mt-1 font-bold">₹{m.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
