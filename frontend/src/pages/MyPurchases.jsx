
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Message } from "../components/ui";

export default function MyPurchases() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get("/cart/purchases");
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading your purchases...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">My Purchases</h1>

      <p className="text-gray-500 mb-6">
        View and track your purchased handmade products.
      </p>

      {location.state?.success && (
        <Message>
          Your order #{location.state.orderId} has been placed successfully!
        </Message>
      )}

      {error && <Message>{error}</Message>}

      {orders.length === 0 ? (
        <div className="stitch rounded-xl text-center py-10">
          <div className="text-5xl mb-4">📦</div>

          <h2 className="text-xl font-semibold">
            No purchases yet
          </h2>

          <p className="text-gray-500 mt-2">
            Your placed orders will appear here.
          </p>

          <Link
            to="/"
            className="inline-block mt-5 bg-amber-700 text-white px-6 py-3 rounded-lg"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="stitch rounded-xl p-6"
            >
              <div className="flex flex-wrap justify-between gap-3 border-b pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold">
                    Order #{order.id}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {order.status}
                  </span>

                  <p className="text-sm mt-2">
                    Payment: {order.payment_status}
                  </p>
                </div>
              </div>

              <h3 className="font-semibold mb-3">Products</h3>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 border-b pb-3"
                  >
                    <div>
                      <p className="font-medium">
                        {item.product_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        ₹{Number(item.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold">
                      ₹{(
                        Number(item.price) * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Order Total</span>
                <span>
                  ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>

              <div className="mt-5 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Delivery Address
                </h3>

                <p className="text-sm text-gray-600">
                  {order.customer_name}
                  <br />
                  {order.phone}
                  <br />
                  {order.address}
                  <br />
                  {order.city}, {order.state} - {order.pincode}
                </p>

                <p className="text-sm text-gray-600 mt-3">
                  Payment Method: {order.payment_method}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
