import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { errMsg } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Message, Empty } from "../components/ui";

export default function CreatorProfile() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get(`/creators/${id}`), api.get("/products", { params: { creator_id: id } })])
      .then(([a, b]) => { setC(a.data); setItems(b.data); })
      .catch((e) => setError(errMsg(e)));
  }, [id]);
  if (error) return <Message>{error}</Message>;
  if (!c) return <p>Loading…</p>;
  return (
    <div className="space-y-6">
      <section className="stitch p-6">
        <h1 className="text-3xl font-bold">{c.name}</h1>
        <p className="text-rose-600 font-semibold">{c.specialty} · {c.location}</p>
        <p className="mt-2 max-w-prose">{c.bio}</p>
      </section>
      <h2 className="text-2xl font-bold">Their work</h2>
      {items.length === 0 ? <Empty>No products yet.</Empty> : <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
