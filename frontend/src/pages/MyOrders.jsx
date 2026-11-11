import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Message, Empty, StatusBadge } from "../components/ui";

export default function MyOrders() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  const load = async (addr) => {
    setError("");
    try { setOrders((await api.get("/orders", { params: { email: addr.trim().toLowerCase() } })).data); }
    catch (e) { setError(errMsg(e)); }
  };
  useEffect(() => { if (email) load(email); }, []); // eslint-disable-line

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-3xl font-bold">My orders</h1>
      <form onSubmit={(e) => { e.preventDefault(); load(email); }} className="flex gap-2">
        <input required type="email" className="input" placeholder="Email used when ordering" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <button className="btn">Find orders</button>
      </form>
      <Message>{error}</Message>
      {orders && (orders.length === 0 ? <Empty>No orders for this email yet.</Empty> : orders.map((o) => (
        <div key={o.id} className="stitch p-4 space-y-1">
          <div className="flex justify-between items-center"><b>#{o.id} · {o.category}</b><StatusBadge status={o.status} /></div>
          <p className="text-sm">Creator: {o.creator_name} · Qty {o.quantity} · Budget ₹{o.budget}</p>
          <p className="text-sm text-plum/80">{o.requirements}</p>
        </div>
      )))}
    </div>
  );
}
