import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import api, { errMsg } from "../services/api";
import { PRODUCT_CATEGORIES, STATUSES } from "../services/constants";
import { Field, Message, Empty, StatusBadge } from "../components/ui";

const TABS = ["Orders", "Products", "AI assistant", "Stats"];

export default function Dashboard() {
  const [creators, setCreators] = useState([]);
  const [cid, setCid] = useState(Number(localStorage.getItem("hh_creator")) || "");
  const [tab, setTab] = useState("Orders");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/creators").then((r) => { setCreators(r.data); if (!cid && r.data[0]) setCid(r.data[0].id); }).catch((e) => setError(errMsg(e)));
  }, []); // eslint-disable-line
  useEffect(() => { if (cid) localStorage.setItem("hh_creator", cid); }, [cid]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Creator dashboard</h1>
        <label className="text-sm font-semibold">Working as{" "}
          <select className="input inline-block w-auto ml-1" value={cid} onChange={(e) => setCid(Number(e.target.value))}>
            {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-plum/60">MVP note: there is no login yet. Pick a demo creator to manage their data.</p>
      <Message>{error}</Message>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${tab === t ? "bg-plum text-cream border-plum" : "bg-white border-lav-300 hover:bg-lav-100"}`}>{t}</button>)}
      </div>
      {cid && tab === "Orders" && <OrdersTab cid={cid} />}
      {cid && tab === "Products" && <ProductsTab cid={cid} />}
      {tab === "AI assistant" && <AITab />}
      {cid && tab === "Stats" && <StatsTab cid={cid} />}
    </div>
  );
}

function OrdersTab({ cid }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const load = () => api.get("/orders", { params: { creator_id: cid } }).then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [cid]); // eslint-disable-line
  const setStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then(load).catch((e) => setError(errMsg(e)));
  return (
    <div className="space-y-3">
      <Message>{error}</Message>
      {orders.length === 0 && <Empty>No custom order requests yet.</Empty>}
      {orders.map((o) => (
        <div key={o.id} className="stitch p-4 space-y-2">
          <div className="flex justify-between items-center"><b>#{o.id} · {o.category} for {o.customer_name}</b><StatusBadge status={o.status} /></div>
          <p className="text-sm">{o.requirements}</p>
          <p className="text-sm text-plum/70">{[o.material, o.colour, o.size].filter(Boolean).join(" · ")} · Qty {o.quantity} · Budget ₹{o.budget} · {o.customer_email}</p>
          {o.design_description && <p className="text-sm italic">{o.design_description}</p>}
          <div className="flex flex-wrap gap-2 items-center">
            {o.status === "Pending" ? (<>
              <button className="btn" onClick={() => setStatus(o.id, "Accepted")}>Accept</button>
              <button className="btn-soft" onClick={() => setStatus(o.id, "Rejected")}>Reject</button>
            </>) : (
              <select className="input w-auto" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} aria-label="Update status">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const blank = { name: "", category: "Crochet", price: "", material: "", colour: "", description: "", image: "" };

function ProductsTab({ cid }) {
  const [items, setItems] = useState([]);
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const load = () => api.get("/products", { params: { creator_id: cid } }).then((r) => setItems(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [cid]); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault(); setError("");
    try { await api.post("/products", { ...f, price: Number(f.price), creator_id: cid }); setF(blank); load(); }
    catch (err) { setError(errMsg(err)); }
  };
  const remove = (id) => api.delete(`/products/${id}`).then(load).catch((e) => setError(errMsg(e)));
  const edit = async (p) => {
    const price = window.prompt(`New price for ${p.name} (₹)`, p.price);
    if (price === null) return;
    try { await api.put(`/products/${p.id}`, { name: p.name, category: p.category, price: Number(price), description: p.description, material: p.material, colour: p.colour, image: p.image }); load(); }
    catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={add} className="stitch p-5 space-y-3">
        <h2 className="text-xl font-bold">Add a product</h2>
        <Field label="Name"><input required className="input" value={f.name} onChange={set("name")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><select className="input" value={f.category} onChange={set("category")}>{PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Price (₹)"><input required type="number" min="1" className="input" value={f.price} onChange={set("price")} /></Field>
          <Field label="Material"><input className="input" value={f.material} onChange={set("material")} /></Field>
          <Field label="Colour"><input className="input" value={f.colour} onChange={set("colour")} /></Field>
        </div>
        <Field label="Description (try the AI assistant tab)"><textarea rows={3} className="input" value={f.description} onChange={set("description")} /></Field>
        <Field label="Image URL (optional)"><input className="input" value={f.image} onChange={set("image")} /></Field>
        <Message>{error}</Message>
        <button className="btn">Add product</button>
      </form>
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Your products</h2>
        {items.length === 0 && <Empty>Nothing listed yet.</Empty>}
        {items.map((p) => (
          <div key={p.id} className="stitch p-3 flex justify-between items-center gap-2">
            <div><b>{p.name}</b><p className="text-sm text-plum/70">{p.category} · ₹{p.price}</p></div>
            <div className="flex gap-2">
              <button className="btn-soft" onClick={() => edit(p)}>Edit price</button>
              <button className="btn-soft" onClick={() => remove(p.id)} aria-label={`Delete ${p.name}`}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AITab() {
  const [f, setF] = useState({ name: "", category: "Crochet", material: "", colour: "", details: "" });
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = async (e) => {
    e.preventDefault(); setBusy(true); setError(""); setRes(null);
    try { setRes((await api.post("/ai/describe", f)).data); } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={run} className="stitch p-5 space-y-3">
        <h2 className="text-xl font-bold">Write a product description</h2>
        <Field label="Product name"><input required className="input" value={f.name} onChange={set("name")} /></Field>
        <Field label="Category"><select className="input" value={f.category} onChange={set("category")}>{PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Material"><input className="input" value={f.material} onChange={set("material")} /></Field>
          <Field label="Colour"><input className="input" value={f.colour} onChange={set("colour")} /></Field>
        </div>
        <Field label="Product details"><textarea rows={3} className="input" value={f.details} onChange={set("details")} /></Field>
        <Message>{error}</Message>
        <button className="btn" disabled={busy}><Sparkles size={16} />{busy ? "Writing…" : "Generate description"}</button>
      </form>
      <div className="stitch p-5 space-y-3">
        <h2 className="text-xl font-bold">Result</h2>
        {!res ? <p className="text-plum/60">Your description will appear here.</p> : (<>
          <Message type={res.mode === "ai" ? "info" : "error"}>{res.note}</Message>
          <p className="whitespace-pre-wrap">{res.description}</p>
          <button className="btn-soft" onClick={() => navigator.clipboard.writeText(res.description)}>Copy text</button>
        </>)}
      </div>
    </div>
  );
}

function StatsTab({ cid }) {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/creators/${cid}/stats`).then((r) => setS(r.data)).catch((e) => setError(errMsg(e))); }, [cid]);
  if (error) return <Message>{error}</Message>;
  if (!s) return <p>Loading…</p>;
  const cards = [["Products", s.total_products], ["Order requests", s.total_orders], ["Completed order value", `₹${s.completed_order_value}`]];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">{cards.map(([l, v]) => <div key={l} className="stitch p-5"><p className="text-sm text-plum/70">{l}</p><p className="text-3xl font-bold font-display">{v}</p></div>)}</div>
      <div className="stitch p-5"><h2 className="font-bold mb-2">Orders by status</h2>
        {Object.entries(s.by_status).map(([k, v]) => <div key={k} className="flex justify-between py-1 border-b border-lav-100"><StatusBadge status={k} /><b>{v}</b></div>)}
      </div>
    </div>
  );
}
