
import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");
      setProducts(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-plum">
          ❤️ My Wishlist
        </h1>
        <p className="text-sm text-plum/70 mt-2">
          Your favorite handmade creations, all in one place.
        </p>
      </div>

      {loading && (
        <p className="text-plum/70">Loading your wishlist...</p>
      )}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="stitch p-8 text-center">
          <p className="text-5xl mb-3">♡</p>
          <h2 className="text-xl font-bold">
            Your wishlist is empty!
          </h2>
          <p className="text-plum/70 mt-2">
            Explore handmade products and tap the heart to save your favorites.
          </p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <p className="text-sm text-plum/70">
            {products.length} saved product(s)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
