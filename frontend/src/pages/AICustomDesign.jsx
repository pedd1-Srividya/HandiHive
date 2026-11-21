
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  WandSparkles,
  Palette,
  RefreshCw,
  Send,
  CheckCircle2,
} from "lucide-react";

import api, { errMsg } from "../services/api";
import { Field, Message } from "../components/ui";
import puter from "@heyputer/puter.js";

const CATEGORIES = [
  "Crochet",
  "Jewellery",
  "Bracelets",
  "Embroidery",
  "Pipe-cleaner Crafts",
  "Personalized Gifts",
  "Home Decor",
  "Accessories",
  "Other Handmade Crafts",
];

export default function AICustomDesign() {
  const [form, setForm] = useState({
    idea: "",
    category: "",
    preferred_material: "",
    preferred_colour: "",
    budget: "",
  });

  const [design, setDesign] = useState(null);
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    api.get("/creators")
      .then((res) => setCreators(res.data))
      .catch((err) => setError(errMsg(err)));
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDesign = (key, value) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  };

  const generateDesign = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(null);
    setDesign(null);
    setPreviewImage("");
    setPreviewError("");
    setCreatorId("");
    setGenerating(true);

    try {
      const response = await api.post("/ai/custom-design", {
        ...form,
        budget: Number(form.budget || 0),
      });

      setDesign(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setGenerating(false);
    }
  };

  const generateVisualPreview = async () => {
    if (!design) return;

    setGeneratingPreview(true);
    setPreviewError("");
    setPreviewImage("");

    try {
      const prompt = `
        Create a realistic professional product photograph of a handmade item.

        Product: ${design.product_name}
        Category: ${design.category}
        Materials: ${(design.materials || []).join(", ")}
        Colours: ${(design.colours || []).join(", ")}
        Size: ${design.size}
        Style: ${design.style}
        Design details: ${design.design_description}

        Show the complete handmade product clearly.
        Use accurate colours and materials.
        Elegant studio lighting, clean neutral background,
        high-quality e-commerce product photography.
        No text, no watermark, no extra products.
      `;

      const image = await puter.ai.txt2img(prompt, {
        ratio: { w: 1, h: 1 },
      });

      setPreviewImage(image.src);
    } catch (err) {
      console.error("Visual preview error:", err);
      setPreviewError(
        err?.message || "Unable to generate the preview. Please try again."
      );
    } finally {
      setGeneratingPreview(false);
    }
  };

  const sendToCreator = async () => {
    if (!creatorId) {
      setError("Please select a creator first.");
      return;
    }

    if (!design) return;

    setError("");
    setSending(true);

    try {
      const description = [
        `Product: ${design.product_name}`,
        `Style: ${design.style}`,
        design.design_description,
      ].join("\n\n");

      // Convert the generated preview into a persistent image data URL.
      let previewImageData = null;

      if (previewImage) {
        const imageResponse = await fetch(previewImage);

        if (!imageResponse.ok) {
          throw new Error("Unable to access the preview image.");
        }

        const imageBlob = await imageResponse.blob();

        previewImageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () =>
            reject(new Error("Unable to prepare the preview image."));

          reader.readAsDataURL(imageBlob);
        });
      }

      const response = await api.post("/orders", {
        creator_id: Number(creatorId),
        category: design.category || "Other Handmade Crafts",
        material: (design.materials || []).join(", "),
        colour: (design.colours || []).join(", "),
        size: design.size || "To be discussed",
        quantity: 1,
        budget: Number(form.budget || 0),
        requirements: design.requirements || form.idea,
        design_description: description,
        preview_image: previewImageData,
      });

      setSuccess(response.data);
    } catch (err) {
      console.error("Custom order submission error:", err);
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="stitch max-w-2xl mx-auto p-8 space-y-5 text-center">
        <CheckCircle2
          size={56}
          className="mx-auto text-green-600"
        />

        <h1 className="text-3xl font-bold">
          Design request sent!
        </h1>

        <p className="text-plum/70">
          Your custom design request #{success.id} has been
          sent to {success.creator_name}.
        </p>

        <p>
          Current status: <b>{success.status}</b>
        </p>

        {success.preview_image && (
          <div className="space-y-2">
            <p className="font-semibold">Your submitted design preview</p>
            <img
              src={success.preview_image}
              alt="Submitted handmade design preview"
              className="w-full max-w-sm mx-auto rounded-xl shadow-md object-contain"
            />
          </div>
        )}

        <Link to="/my-orders" className="btn inline-block">
          Track My Order
        </Link>

        <button
          className="block mx-auto text-lav-600 font-semibold"
          onClick={() => {
            setSuccess(null);
            setDesign(null);
            setCreatorId("");
            setPreviewImage("");
            setPreviewError("");
            setForm({
              idea: "",
              category: "",
              preferred_material: "",
              preferred_colour: "",
              budget: "",
            });
          }}
        >
          Create another design
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="rounded-full bg-lav-100 p-4">
            <WandSparkles
              size={34}
              className="text-lav-600"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold">
          AI Custom Design Assistant
        </h1>

        <p className="text-plum/70 max-w-2xl mx-auto">
          Have an idea for something handmade? Describe it
          and let our AI help turn your imagination into a
          personalized design.
        </p>
      </div>

      <form
        onSubmit={generateDesign}
        className="stitch p-6 sm:p-8 space-y-5"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-rose-500" />
          Describe Your Idea
        </h2>

        <Field label="What would you like to create?">
          <textarea
            required
            minLength={5}
            maxLength={2000}
            rows={5}
            className="input"
            placeholder="Example: I want a lavender bracelet with white pearls and a small heart charm. It should look elegant and be suitable for gifting..."
            value={form.idea}
            onChange={(e) => updateForm("idea", e.target.value)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Preferred category">
            <select
              className="input"
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
            >
              <option value="">Let AI decide</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Preferred material">
            <input
              className="input"
              placeholder="e.g. Pearls, cotton yarn, beads"
              value={form.preferred_material}
              onChange={(e) =>
                updateForm("preferred_material", e.target.value)
              }
            />
          </Field>

          <Field label="Preferred colours">
            <input
              className="input"
              placeholder="e.g. Lavender and white"
              value={form.preferred_colour}
              onChange={(e) =>
                updateForm("preferred_colour", e.target.value)
              }
            />
          </Field>

          <Field label="Your budget (₹)">
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Optional"
              value={form.budget}
              onChange={(e) => updateForm("budget", e.target.value)}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="btn w-full flex justify-center items-center gap-2"
        >
          {generating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Creating your design...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate My Design
            </>
          )}
        </button>
      </form>

      <Message>{error}</Message>

      {design && (
        <div className="stitch p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="text-sm text-lav-600 font-semibold">
                YOUR AI-GENERATED DESIGN
              </p>
              <h2 className="text-2xl font-bold">
                {design.product_name}
              </h2>
            </div>

            <span className="text-xs rounded-full bg-lav-100 px-3 py-2 font-semibold">
              {design.mode === "ai" ? "AI Generated" : "Demo Result"}
            </span>
          </div>

          <p className="text-sm text-plum/60">
            {design.note}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product name">
              <input
                className="input"
                value={design.product_name || ""}
                onChange={(e) =>
                  updateDesign("product_name", e.target.value)
                }
              />
            </Field>

            <Field label="Category">
              <input
                className="input"
                value={design.category || ""}
                onChange={(e) =>
                  updateDesign("category", e.target.value)
                }
              />
            </Field>

            <Field label="Materials (comma-separated)">
              <input
                className="input"
                value={(design.materials || []).join(", ")}
                onChange={(e) =>
                  updateDesign(
                    "materials",
                    e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                  )
                }
              />
            </Field>

            <Field label="Colours (comma-separated)">
              <input
                className="input"
                value={(design.colours || []).join(", ")}
                onChange={(e) =>
                  updateDesign(
                    "colours",
                    e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                  )
                }
              />
            </Field>

            <Field label="Size">
              <input
                className="input"
                value={design.size || ""}
                onChange={(e) => updateDesign("size", e.target.value)}
              />
            </Field>

            <Field label="Style">
              <input
                className="input"
                value={design.style || ""}
                onChange={(e) => updateDesign("style", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Design description">
            <textarea
              rows={5}
              className="input"
              value={design.design_description || ""}
              onChange={(e) =>
                updateDesign("design_description", e.target.value)
              }
            />
          </Field>

          <Field label="Customization suggestions">
            <textarea
              rows={4}
              className="input"
              value={(design.customization_suggestions || []).join("\n")}
              onChange={(e) =>
                updateDesign(
                  "customization_suggestions",
                  e.target.value.split("\n")
                )
              }
            />
          </Field>

          <Field label="Instructions for the creator">
            <textarea
              rows={5}
              className="input"
              value={design.requirements || ""}
              onChange={(e) =>
                updateDesign("requirements", e.target.value)
              }
            />
          </Field>

          {/* AI VISUAL DESIGN PREVIEW */}
          <div className="rounded-2xl border border-lav-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="text-lav-600" size={22} />
              <div>
                <h3 className="font-bold text-lg">
                  AI Visual Design Preview
                </h3>
                <p className="text-sm text-plum/60">
                  See how your handmade design could look.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={generateVisualPreview}
              disabled={generatingPreview}
              className="btn w-full flex justify-center items-center gap-2"
            >
              {generatingPreview ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating visual preview...
                </>
              ) : (
                <>
                  <WandSparkles size={18} />
                  {previewImage ? "Regenerate Preview" : "Generate Visual Preview"}
                </>
              )}
            </button>

            {previewError && (
              <p className="text-sm text-red-600">
                {previewError}
              </p>
            )}

            {previewImage && (
              <div className="space-y-3">
                <img
                  src={previewImage}
                  alt="AI generated handmade product preview"
                  className="w-full max-w-md mx-auto rounded-xl shadow-md object-contain"
                />

                <p className="text-center text-sm text-green-700 font-medium">
                  Your AI visual preview is ready!
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-lav-50 p-4 space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <Palette size={18} />
              Choose Your Handmade Creator
            </h3>

            <select
              required
              className="input"
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
            >
              <option value="">Select a creator</option>

              {creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name} - {creator.specialty}
                </option>
              ))}
            </select>

            {creators.length === 0 && (
              <p className="text-sm text-plum/60">
                No creators are currently available.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={sendToCreator}
            disabled={sending || creators.length === 0}
            className="btn w-full flex justify-center items-center gap-2"
          >
            <Send size={18} />
            {sending ? "Sending request..." : "Send Design to Creator"}
          </button>
        </div>
      )}
    </div>
  );
}
