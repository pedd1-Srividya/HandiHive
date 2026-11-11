import "./AIDescriptionGenerator.css";
import { useState } from "react";
import { generateProductDescription } from "../api/ai";

export default function AIDescriptionGenerator() {
  const [form, setForm] = useState({
    name: "",
    category: "Crochet",
    material: "",
    colour: "",
    details: "",
  });

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setDescription("");

    try {
      const result = await generateProductDescription(form);

      setDescription(result.description);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to generate description. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-generator">
      <h2>✨ AI Product Description Generator</h2>
      <p>Create attractive descriptions for your handmade products.</p>

      <form onSubmit={handleGenerate}>
        <label>Product Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Handmade Crochet Bunny"
          required
        />

        <label>Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option>Crochet</option>
          <option>Bracelets</option>
          <option>Jewellery</option>
          <option>Pipe Cleaner Crafts</option>
          <option>Embroidery</option>
          <option>Painting</option>
          <option>Personalized Gifts</option>
          <option>Other Handmade Crafts</option>
        </select>

        <label>Material</label>
        <input
          name="material"
          value={form.material}
          onChange={handleChange}
          placeholder="Cotton yarn, beads, etc."
        />

        <label>Colour</label>
        <input
          name="colour"
          value={form.colour}
          onChange={handleChange}
          placeholder="Lavender"
        />

        <label>Additional Details</label>
        <textarea
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="Describe your handmade product..."
          rows="4"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "✨ Generate AI Description"}
        </button>
      </form>

      {error && <p className="ai-error">{error}</p>}

      {description && (
        <div className="ai-result">
          <h3>Generated Description</h3>
          <p>{description}</p>

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(description)
            }
          >
            Copy Description
          </button>
        </div>
      )}
    </div>
  );
}
