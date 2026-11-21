
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Message } from "../components/ui";

export default function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  const loadCart = async () => {
    try {
      setError("");
      const res = await api.get("/cart");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1 || quantity > 100) return;

    try {
      setUpdating(itemId);
      await api.patch(`/cart/${itemId}`, { quantity });
      await loadCart();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdating(itemId);
      await api.delete(`/cart/${itemId}`);
      await loadCart();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUpdating(null);
    }
  };

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.product?.price || 0) * item.quantity,
    0
  );

  if (loading) {
    return <div className="p-8 text-center">Loading your cart...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">
            Review your handmade treasures before checkout.
          </p>
        </div>

        <Link to="/" className="text-amber-700 font-semibold">
          Continue Shopping
        </Link>
      </div>

      {error && <Message>{error}</Message>}

      {items.length === 0 ? (
        <div className="stitch rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-gray-500 mt-2">
            Explore unique handmade products from our creators.
          </p>
          <Link
            to="/"
            className="inline-block mt-5 bg-amber-700 text-white px-6 py-3 rounded-lg"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="stitch rounded-xl p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-semibold text-lg hover:text-amber-700"
                    >
                      {item.product?.name}
                    </Link>

                    <p className="text-amber-700 font-semibold mt-2">
                      ₹{Number(item.product?.price || 0).toFixed(2)}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Creator: {item.product?.creator_name || "Handmade Creator"}
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={updating === item.id || item.quantity <= 1}
                        className="border rounded px-3 py-1 disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={updating === item.id || item.quantity >= 100}
                        className="border rounded px-3 py-1 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                    <p className="font-bold">
                      ₹{(
                        Number(item.product?.price || 0) * item.quantity
                      ).toFixed(2)}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="stitch rounded-xl p-5 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="flex justify-between text-gray-600 mb-3">
              <span>Total items</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-4">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-6 bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold"
            >
              Proceed to Checkout
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Payment method: Cash on Delivery
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
