
import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";

const STATUS_OPTIONS = [
  "Placed",
  "Accepted",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [notes, setNotes] = useState({});
  const [tracking, setTracking] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchOrders = async () => {
    try {
      setError("");
      const response = await api.get("/material-orders/admin/all");
      setOrders(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, status) => {
    setSelectedStatus((prev) => ({
      ...prev,
      [orderId]: status,
    }));
  };

  const handleNoteChange = (orderId, note) => {
    setNotes((prev) => ({
      ...prev,
      [orderId]: note,
    }));
  };

  const updateStatus = async (orderId, currentStatus) => {
    const status = selectedStatus[orderId] || currentStatus;

    if (status === currentStatus) {
      setMessage("Please select a different status.");
      return;
    }

    try {
      setUpdating(orderId);
      setError("");
      setMessage("");

      await api.patch(
        `/material-orders/admin/${orderId}/status`,
        {
          status,
          note: notes[orderId] || "",
        }
      );

      setMessage(`Order #${orderId} status updated successfully.`);

      setSelectedStatus((prev) => ({
        ...prev,
        [orderId]: status,
      }));

      await fetchOrders();

      if (expandedOrder === orderId) {
        await fetchTracking(orderId);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUpdating(null);
    }
  };

  const fetchTracking = async (orderId) => {
    try {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        Loading material orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-600">
          Admin Dashboard
        </h1>

        <p className="text-plum/70 mt-2">
          Manage material purchases and update delivery statuses.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-plum/70 font-semibold">
          Total Material Orders
        </p>

        <p className="text-4xl font-bold text-lav-600 mt-2">
          {orders.length}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-plum">
          Material Orders
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            No material orders found.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow p-6 space-y-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-lav-600">
                    Order #{order.id}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Placed: {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="bg-lav-100 text-lav-700 px-4 py-2 rounded-full font-semibold">
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-2">
                    Customer Details
                  </h4>

                  <p>{order.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {order.customer_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {order.phone}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">
                    Delivery Address
                  </h4>

                  <p>{order.address}</p>
                  <p>
                    {order.city}, {order.state}
                  </p>
                  <p>PIN: {order.pincode}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">
                  Purchased Materials
                </h4>

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

              <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Payment: {order.payment_method}
                  </p>

                  <p className="text-sm text-gray-600">
                    Payment Status: {order.payment_status}
                  </p>

                  <p className="text-xl font-bold text-lav-600 mt-2">
                    Total: ₹{order.total_amount}
                  </p>
                </div>
              </div>

              <div className="border-t pt-5 space-y-3">
                <h4 className="font-bold">
                  Update Order Status
                </h4>

                <select
                  value={
                    selectedStatus[order.id] || order.status
                  }
                  onChange={(e) =>
                    handleStatusChange(
                      order.id,
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <textarea
                  value={notes[order.id] || ""}
                  onChange={(e) =>
                    handleNoteChange(
                      order.id,
                      e.target.value
                    )
                  }
                  placeholder="Add an update note (optional)"
                  rows={2}
                  className="w-full border rounded-lg p-3"
                />

                <button
                  onClick={() =>
                    updateStatus(order.id, order.status)
                  }
                  disabled={updating === order.id}
                  className="bg-lav-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-lav-700 disabled:opacity-50"
                >
                  {updating === order.id
                    ? "Updating..."
                    : "Update Status"}
                </button>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={() => toggleTracking(order.id)}
                  className="text-lav-600 font-bold hover:underline"
                >
                  {expandedOrder === order.id
                    ? "Hide Tracking History"
                    : "View Tracking History"}
                </button>

                {expandedOrder === order.id && (
                  <div className="mt-4 space-y-4">
                    {tracking[order.id]?.length > 0 ? (
                      tracking[order.id].map((entry) => (
                        <div
                          key={entry.id}
                          className="border-l-4 border-lav-400 pl-4 py-2"
                        >
                          <p className="font-bold">
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

                          <p className="text-xs text-gray-500 mt-1">
                            Updated by user #{entry.updated_by_user_id}
                          </p>
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
    </div>
  );
}
