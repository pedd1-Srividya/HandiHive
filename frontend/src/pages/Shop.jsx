
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  ImagePlus,
  X,
  RefreshCw,
  Camera,
} from "lucide-react";

import api, { errMsg } from "../services/api";
import { PRODUCT_CATEGORIES } from "../services/constants";
import ProductCard from "../components/ProductCard";
import { Empty, Message } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Shop() {
  const { isCustomer, loading: authLoading } = useAuth();

  const fileInputRef = useRef(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // AI image search states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageResults, setImageResults] = useState([]);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  // Fetch normal shop products
  useEffect(() => {
    setLoading(true);

    const t = setTimeout(() => {
      api.get("/products", {
        params: {
          q: q || undefined,
          category: category || undefined,
        },
      })
        .then((r) => {
          setItems(r.data);
          setError("");
        })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(t);
  }, [q, category]);

  // Fetch personalized recommendations for customers
  useEffect(() => {
    if (authLoading || !isCustomer) {
      setRecommendedItems([]);
      return;
    }

    api.get("/recommendations")
      .then((r) => setRecommendedItems(r.data))
      .catch(() => setRecommendedItems([]));
  }, [isCustomer, authLoading]);

  // Select an image
  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageError("");
    setImageResults([]);
    setImageAnalysis(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Please select a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Search products using Gemini image analysis
  async function handleImageSearch() {
    if (!selectedImage) {
      setImageError("Please select a product image first.");
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageResults([]);
    setImageAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const response = await api.post(
        "/ai/image-search",
        formData
      );

      setImageResults(response.data.matches || []);
      setImageAnalysis(response.data.analysis || null);
    } catch (e) {
      setImageError(errMsg(e));
    } finally {
      setImageLoading(false);
    }
  }

  // Clear image search
  function clearImageSearch() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
    setImageResults([]);
    setImageAnalysis(null);
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">

      <section className="stitch p-6 md:p-10 bg-gradient-to-br from-lav-100 to-rose-100">
        <h1 className="text-3xl md:text-5xl font-bold max-w-2xl">
          Things made by hand, by someone you can message.
        </h1>

        <p className="mt-3 max-w-xl text-plum/80">
          Browse finished pieces, or ask a creator to make something just for you.
        </p>

        <div className="relative mt-5 max-w-lg">
          <Search className="absolute left-3 top-2.5 text-lav-600" size={20} />

          <input
            className="input pl-10"
            placeholder="Search crochet, bracelets, gifts..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search products"
          />
        </div>
      </section>

      {/* AI Image Search */}
      <section className="stitch bg-white p-5 md:p-7 space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="text-rose-500" size={25} />
            Find Products Using an Image
          </h2>

          <p className="text-sm text-plum/70 mt-2">
            Upload a photo of something you like. Our AI will understand
            the design and find similar handmade products on HandiHive.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />

        {!imagePreview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-lav-300 rounded-2xl p-8 hover:bg-lav-50 transition flex flex-col items-center gap-3"
          >
            <ImagePlus size={38} className="text-lav-600" />
            <span className="font-semibold">
              Choose an image from your device
            </span>
            <span className="text-xs text-plum/60">
              JPG, PNG or WEBP · Maximum 5 MB
            </span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={imagePreview}
              alt="Selected product"
              className="w-full sm:w-56 h-56 object-contain rounded-xl bg-lav-50 border border-lav-200"
            />

            <div className="flex flex-col gap-3">
              <p className="font-semibold break-all">
                {selectedImage?.name}
              </p>

              <p className="text-sm text-plum/60">
                Image selected successfully.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                Change Image
              </button>

              <button
                type="button"
                onClick={clearImageSearch}
                className="text-sm text-red-600 flex items-center gap-1"
              >
                <X size={16} />
                Clear Image
              </button>
            </div>
          </div>
        )}

        <Message>{imageError}</Message>

        <button
          type="button"
          onClick={handleImageSearch}
          disabled={!selectedImage || imageLoading}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {imageLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Analyzing Image...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Search by Image
            </>
          )}
        </button>

        {/* AI Analysis */}
        {imageAnalysis && (
          <div className="rounded-xl bg-lav-50 border border-lav-200 p-4 space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles size={18} />
              AI Image Analysis
            </h3>

            <p className="text-sm">
              <strong>Product:</strong> {imageAnalysis.product_type}
            </p>

            <p className="text-sm">
              <strong>Category:</strong> {imageAnalysis.category}
            </p>

            <p className="text-sm">
              <strong>Colours:</strong>{" "}
              {(imageAnalysis.colours || []).join(", ") || "Not identified"}
            </p>

            <p className="text-sm">
              <strong>Materials:</strong>{" "}
              {(imageAnalysis.materials || []).join(", ") || "Not identified"}
            </p>

            <p className="text-sm">
              <strong>Features:</strong>{" "}
              {(imageAnalysis.visual_features || []).join(", ") || "None"}
            </p>
          </div>
        )}

        {/* Image Search Results */}
        {imageAnalysis && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">
                Similar Handmade Products
              </h3>

              <p className="text-sm text-plum/70 mt-1">
                {imageResults.length} matching products found.
              </p>
            </div>

            {imageResults.length === 0 ? (
              <Empty>
                No similar products were found. Try another image.
              </Empty>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {imageResults.map((match) => (
                  <div key={match.product.id} className="space-y-2">
                    <ProductCard p={match.product} />

                    <p className="text-xs text-plum/70 px-1">
                      <Sparkles
                        size={13}
                        className="inline mr-1 text-rose-500"
                      />
                      {match.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Personalized Recommendations */}
      {isCustomer && recommendedItems.length > 0 && !q && !category && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-rose-500" size={23} />
              Recommended for You
            </h2>

            <p className="text-sm text-plum/70 mt-1">
              Handmade products selected based on your interests and activity.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {recommendedItems.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {["", ...PRODUCT_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${
              category === c
                ? "bg-plum text-cream border-plum"
                : "border-lav-300 bg-white hover:bg-lav-100"
            }`}
          >
            {c || "All"}
          </button>
        ))}
      </div>

      <Message>{error}</Message>

      {/* All Products */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          {q || category ? "Search Results" : "Explore Handmade Products"}
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <Empty>
            No products match. Try another search or category.
          </Empty>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
