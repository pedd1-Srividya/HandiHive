
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tile } from "./ui";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function ProductCard({ p }) {
  const { user, isCustomer } = useAuth();

  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!user || !isCustomer) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const response = await api.get("/wishlist");
        const saved = response.data.some(
          (product) => product.id === p.id
        );
        setIsFavorite(saved);
      } catch (error) {
        console.error("Could not load wishlist", error);
      }
    };

    checkFavorite();
  }, [user, isCustomer, p.id]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !isCustomer) {
      setMessage("Please log in as a customer to save favorites.");
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/wishlist/${p.id}`);
        setIsFavorite(false);
        setMessage("Removed from favorites");
      } else {
        await api.post(`/wishlist/${p.id}`);
        setIsFavorite(true);
        setMessage("Added to favorites ❤️");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Could not update favorites."
      );
    }
  };

  const shareProduct = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const productUrl = `${window.location.origin}/product/${p.id}`;

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
        setShareMessage("Product link copied! 🔗");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(productUrl);
          setShareMessage("Product link copied! 🔗");
        } catch {
          setShareMessage("Unable to share or copy the link.");
        }
      }
    }
  };

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !isCustomer) {
      setCartMessage("Please log in as a customer to add products to cart.");
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage("");

      await api.post("/cart", {
        product_id: p.id,
        quantity: 1,
      });

      setCartMessage("Added to cart successfully! 🛒");
    } catch (error) {
      setCartMessage(
        error.response?.data?.detail || "Could not add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link
      to={`/product/${p.id}`}
      className="stitch p-3 block hover:border-lav-600 transition-colors"
    >
      <div className="relative">
        <Tile image={p.image} category={p.category} />

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          className={`absolute top-2 right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-2xl ${
            isFavorite ? "text-red-500" : "text-gray-500"
          }`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="px-1 pt-3">
        <p className="text-xs font-semibold text-rose-600">
          {p.category}
        </p>

        <h3 className="text-lg font-bold leading-snug">{p.name}</h3>

        <p className="text-sm text-plum/70">by {p.creator_name}</p>

        <p className="mt-1 font-bold">₹{p.price}</p>

        <button
          type="button"
          onClick={addToCart}
          disabled={addingToCart}
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          {addingToCart ? "Adding..." : "🛒 Add to Cart"}
        </button>

        <button
          type="button"
          onClick={shareProduct}
          className="btn-soft mt-3 w-full"
        >
          🔗 Share Product
        </button>

        {cartMessage && (
          <p className="mt-2 text-xs text-green-700">
            {cartMessage}
          </p>
        )}

        {message && (
          <p className="mt-2 text-xs text-rose-600">
            {message}
          </p>
        )}

        {shareMessage && (
          <p className="mt-2 text-xs text-green-700">
            {shareMessage}
          </p>
        )}
      </div>
    </Link>
  );
}
