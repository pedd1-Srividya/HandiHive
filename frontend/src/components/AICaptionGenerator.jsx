
import "./AIDescriptionGenerator.css";
import { useState } from "react";
import { generateCaption } from "../api/ai";

export default function AICaptionGenerator() {
  const [form, setForm] = useState({
    name: "",
    category: "Crochet",
    material: "",
    colour: "",
    details: "",
    platform: "Instagram",
    tone: "Creative",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

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
    setResult(null);
    setCopied("");

    try {
      const data = await generateCaption(form);
      setResult(data);
    } catch (err) {
      console.error("Caption generation error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to generate caption. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Unable to copy. Please copy the text manually.");
    }
  };

  return (
    <div className="ai-generator">
      <h2>✨ AI Social Media Caption Generator</h2>

      <p>
        Generate attractive social media captions, hashtags
        and promotional messages for your handmade products.
      </p>

      <form onSubmit={handleGenerate}>
        <label>Product Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Handmade Crochet Bunny"
          minLength={2}
          maxLength={150}
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

        <label>Social Media Platform</label>
        <select
          name="platform"
          value={form.platform}
          onChange={handleChange}
        >
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
        </select>

        <label>Caption Tone</label>
        <select
          name="tone"
          value={form.tone}
          onChange={handleChange}
        >
          <option value="Cute">Cute</option>
          <option value="Professional">Professional</option>
          <option value="Creative">Creative</option>
          <option value="Friendly">Friendly</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "✨ Generate AI Caption"}
        </button>
      </form>

      {error && <p className="ai-error">{error}</p>}

      {result && (
        <div className="ai-result">
          <h3>Generated Caption</h3>
          <p>{result.caption}</p>

          <button
            type="button"
            onClick={() => copyText(result.caption, "caption")}
          >
            {copied === "caption" ? "Copied!" : "Copy Caption"}
          </button>

          <h3>Generated Hashtags</h3>
          <p>{result.hashtags.join(" ")}</p>

          <button
            type="button"
            onClick={() =>
              copyText(result.hashtags.join(" "), "hashtags")
            }
          >
            {copied === "hashtags" ? "Copied!" : "Copy Hashtags"}
          </button>

          <h3>Promotional Text</h3>
          <p>{result.promotional_text}</p>

          <button
            type="button"
            onClick={() =>
              copyText(result.promotional_text, "promotion")
            }
          >
            {copied === "promotion" ? "Copied!" : "Copy Promotional Text"}
          </button>

          <p>
            <strong>Generation Mode:</strong> {result.mode}
          </p>
        </div>
      )}
    </div>
  );
}
