
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Tile, Message } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isCustomer } = useAuth();

  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    setP(null);
    setError("");

    api.get(`/products/${id}`)
      .then((r) => setP(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  useEffect(() => {
    if (!user || !isCustomer) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const response = await api.get("/wishlist");
        setIsFavorite(
          response.data.some((product) => product.id === Number(id))
        );
      } catch (error) {
        console.error("Could not load wishlist", error);
      }
    };

    checkFavorite();
  }, [user, isCustomer, id]);

  const toggleFavorite = async () => {
    setFavoriteMessage("");

    if (!user || !isCustomer) {
      setFavoriteMessage("Please log in as a customer to save favorites.");
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/wishlist/${id}`);
        setIsFavorite(false);
        setFavoriteMessage("Removed from your wishlist.");
      } else {
        await api.post(`/wishlist/${id}`);
        setIsFavorite(true);
        setFavoriteMessage("Added to your wishlist ❤️");
      }
    } catch (error) {
      setFavoriteMessage(
        error.response?.data?.detail || "Could not update your wishlist."
      );
    }
  };

  // Share product link
  const shareProduct = async () => {
    const productUrl =
      `${window.location.origin}/product/${p.id}`;

    const shareData = {
      title: p.name,
      text: `Check out this handmade product on HandiHive: ${p.name}`,
      url: productUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("Product shared successfully! ❤️");
      } else {
        await navigator.clipboard.writeText(productUrl);
        setShareMessage("Product link copied successfully! 🔗");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(productUrl);
          setShareMessage("Product link copied successfully! 🔗");
        } catch {
          setShareMessage("Unable to share or copy the product link.");
        }
      }
    }
  };

  if (error) return <Message>{error}</Message>;
  if (!p) return <p>Loading product...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">

      {/* Product Image */}
      <div className="stitch p-3 bg-white">
        <div className="relative">
          <Tile
            image={p.image}
            category={p.category}
            className="h-96 md:h-[500px]"
          />

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className={`absolute top-3 right-3 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-3xl ${
              isFavorite ? "text-red-500" : "text-gray-500"
            }`}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-4">

        <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide">
          {p.category}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold">
            {p.name}
          </h1>

          <button
            type="button"
            onClick={toggleFavorite}
            className={`text-3xl ${
              isFavorite ? "text-red-500" : "text-gray-500"
            }`}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        {favoriteMessage && (
          <p className="text-sm text-rose-600">
            {favoriteMessage}
          </p>
        )}

        <p className="text-3xl font-bold text-plum">
          ₹{p.price}
        </p>

        {/* Share Product */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={shareProduct}
            className="btn-soft inline-flex items-center gap-2"
          >
            <span>🔗</span>
            Share Product
          </button>

          {shareMessage && (
            <p className="text-sm text-green-700">
              {shareMessage}
            </p>
          )}
        </div>

        <div className="border-t border-lav-200 pt-4">
          <h2 className="font-bold text-lg mb-2">
            Product Description
          </h2>
          <p className="text-plum/80 leading-relaxed">
            {p.description || "No description yet."}
          </p>
        </div>

        <div className="stitch p-4 space-y-3 bg-lav-50">
          <h2 className="font-bold">Product Details</h2>

          <p className="text-sm">
            Material: <b>{p.material || "—"}</b>
          </p>

          <p className="text-sm">
            Colour: <b>{p.colour || "—"}</b>
          </p>

          <p className="text-sm">
            Product Category: <b>{p.category}</b>
          </p>
        </div>

        <p>
          Made with love by{" "}
          <Link
            className="underline font-semibold text-lav-600"
            to={`/creator/${p.creator_id}`}
          >
            {p.creator_name}
          </Link>
        </p>

        <Link
          className="btn inline-block text-center"
          to={`/custom-order?category=${encodeURIComponent(p.category)}&creator=${p.creator_id}`}
        >
          Ask for a Custom Version
        </Link>

        <p className="text-xs text-plum/60">
          Handmade with care. Every creation is unique!
        </p>

      </div>
    </div>
  );
}
