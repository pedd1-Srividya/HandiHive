
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import api, { errMsg } from "../services/api";
import { PRODUCT_CATEGORIES } from "../services/constants";
import { Field, Message } from "../components/ui";

export default function CustomOrder() {
  const [params] = useSearchParams();

  const [creators, setCreators] = useState([]);

  const [f, setF] = useState({
    creator_id: params.get("creator") || "",
    category: params.get("category") || "Crochet",
    material: "",
    colour: "",
    size: "",
    quantity: 1,
    budget: "",
    requirements: "",
    design_description: "",
  });

  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setF({ ...f, [key]: e.target.value });
  };

  // Load creators
  useEffect(() => {
    api.get("/creators")
      .then((response) => setCreators(response.data))
      .catch((err) => setError(errMsg(err)));
  }, []);

  // Submit custom order
  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const payload = {
        ...f,
        creator_id: Number(f.creator_id),
        quantity: Number(f.quantity),
        budget: Number(f.budget || 0),
      };

      const response = await api.post("/orders", payload);

      setDone(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  // Order success page
  if (done) {
    return (
      <div className="stitch p-8 max-w-xl space-y-3">
        <h1 className="text-2xl font-bold">
          Request sent successfully!
        </h1>

        <p>
          Order #{done.id} is now <b>{done.status}</b> with{" "}
          {done.creator_name}.
        </p>

        <Link className="btn" to="/my-orders">
          Track this order
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="stitch p-6 max-w-2xl space-y-4">

      <h1 className="text-3xl font-bold">
        Request a custom piece
      </h1>

      <p className="text-sm text-plum/70">
        Your account details will be attached automatically.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">

        <Field label="Creator">
          <select
            required
            className="input"
            value={f.creator_id}
            onChange={set("creator_id")}
          >
            <option value="">Choose a creator</option>

            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name} - {creator.specialty}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select
            className="input"
            value={f.category}
            onChange={set("category")}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Material">
          <input
            className="input"
            placeholder="e.g. cotton yarn"
            value={f.material}
            onChange={set("material")}
          />
        </Field>

        <Field label="Colour">
          <input
            className="input"
            placeholder="e.g. lavender"
            value={f.colour}
            onChange={set("colour")}
          />
        </Field>

        <Field label="Size">
          <input
            className="input"
            placeholder="e.g. 15 cm / medium"
            value={f.size}
            onChange={set("size")}
          />
        </Field>

        <Field label="Quantity">
          <input
            type="number"
            min="1"
            max="1000"
            required
            className="input"
            value={f.quantity}
            onChange={set("quantity")}
          />
        </Field>

        <Field label="Budget per item (₹)">
          <input
            type="number"
            min="0"
            required
            className="input"
            value={f.budget}
            onChange={set("budget")}
          />
        </Field>

      </div>

      <Field label="What should it be?">
        <textarea
          required
          minLength={5}
          rows={3}
          className="input"
          value={f.requirements}
          onChange={set("requirements")}
        />
      </Field>

      <Field label="Design description">
        <textarea
          rows={3}
          className="input"
          placeholder="Patterns, names, references..."
          value={f.design_description}
          onChange={set("design_description")}
        />
      </Field>

      <Message>{error}</Message>

      <button className="btn" disabled={busy}>
        {busy ? "Sending..." : "Send request"}
      </button>

    </form>
  );
}
