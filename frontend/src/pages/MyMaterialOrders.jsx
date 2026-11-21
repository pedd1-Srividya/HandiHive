
import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";

export default function MyMaterialOrders() {
  const [orders, setOrders] = useState([]);
  const [tracking, setTracking] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError("");

      const response = await api.get(
        "/material-orders/my-orders"
      );

      setOrders(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async (orderId) => {
    try {
      setError("");

      const response = await api.get(
        `/tracking/material/${orderId}`
      );

      setTracking((prev) => ({
        ...prev,
        [orderId]: response.data,
      }));

      setExpandedOrder(orderId);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const toggleTracking = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    await fetchTracking(orderId);
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return "bg-green-100 text-green-700";

      case "Cancelled":
      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Shipped":
      case "Out for Delivery":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        Loading your material orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-600">
          My Material Orders
        </h1>

        <p className="text-plum/70 mt-2">
          View your material purchases and track their delivery.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <h2 className="text-xl font-bold text-plum">
            No Material Orders Yet
          </h2>

          <p className="text-gray-500 mt-2">
            Your purchased craft materials will appear here.
          </p>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow p-6 space-y-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-lav-600">
                  Order #{order.id}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Ordered on: {formatDate(order.created_at)}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full font-semibold ${getStatusStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold mb-3">
                Purchased Materials
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-lav-50">
                      <th className="p-3">Material</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b"
                      >
                        <td className="p-3">
                          {item.material_name}
                        </td>

                        <td className="p-3">
                          ₹{item.price}
                        </td>

                        <td className="p-3">
                          {item.quantity}
                        </td>

                        <td className="p-3">
                          ₹{(
                            item.price * item.quantity
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <h3 className="font-bold mb-2">
                  Delivery Address
                </h3>

                <p>{order.customer_name}</p>
                <p>{order.phone}</p>
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.state} - {order.pincode}
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">
                  Payment Details
                </h3>

                <p>
                  Payment Method: {order.payment_method}
                </p>

                <p>
                  Payment Status: {order.payment_status}
                </p>

                <p className="text-xl font-bold text-lav-600 mt-2">
                  Total: ₹{order.total_amount}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() => toggleTracking(order.id)}
                className="bg-lav-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-lav-700"
              >
                {expandedOrder === order.id
                  ? "Hide Tracking History"
                  : "Track This Order"}
              </button>

              {expandedOrder === order.id && (
                <div className="mt-5 space-y-4">
                  <h3 className="font-bold text-lg">
                    Order Tracking Timeline
                  </h3>

                  {tracking[order.id]?.length > 0 ? (
                    tracking[order.id].map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l-4 border-lav-400 pl-4 py-2"
                      >
                        <p className="font-bold text-plum">
                          {entry.status}
                        </p>

                        <p className="text-sm text-gray-500">
                          {formatDate(entry.created_at)}
                        </p>

                        {entry.note && (
                          <p className="text-sm mt-1">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      No tracking history available.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
