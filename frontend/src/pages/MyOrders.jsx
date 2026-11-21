
import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";
import { Message, Empty, StatusBadge } from "../components/ui";

const statusIcons = {
  Pending: "🕒",
  Accepted: "✓",
  Rejected: "✕",
  "In Progress": "🔨",
  Completed: "🎉",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [forms, setForms] = useState({});
  const [photos, setPhotos] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(null);
  const [tracking, setTracking] = useState({});
  const [trackingLoading, setTrackingLoading] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Load customer orders and existing reviews.
  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");
      const orderList = response.data;

      setOrders(orderList);

      const creatorIds = [
        ...new Set(orderList.map((o) => o.creator_id)),
      ];

      const reviewResponses = await Promise.all(
        creatorIds.map((id) =>
          api.get(`/reviews/creator/${id}`)
        )
      );

      const existingReviews = reviewResponses.flatMap(
        (response) => response.data
      );

      setReviewedOrders(
        existingReviews.map((review) => review.order_id)
      );
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Fetch tracking history for an order.
  const fetchTracking = async (orderId) => {
    try {
      setTrackingLoading((previous) => ({
        ...previous,
        [orderId]: true,
      }));

      const response = await api.get(
        `/tracking/custom/${orderId}`
      );

      setTracking((previous) => ({
        ...previous,
        [orderId]: response.data,
      }));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setTrackingLoading((previous) => ({
        ...previous,
        [orderId]: false,
      }));
    }
  };

  // Open or close the tracking timeline.
  const toggleTracking = async (orderId) => {
    const isOpen = expandedOrders[orderId];

    setExpandedOrders((previous) => ({
      ...previous,
      [orderId]: !isOpen,
    }));

    if (isOpen) {
      return;
    }

    if (!tracking[orderId]) {
      await fetchTracking(orderId);
    }
  };

  // Update review form fields.
  const updateForm = (orderId, field, value) => {
    setForms((previous) => ({
      ...previous,
      [orderId]: {
        rating: 5,
        comment: "",
        ...previous[orderId],
        [field]: value,
      },
    }));
  };

  // Handle review photo uploads.
  const updatePhotos = (orderId, files) => {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length > 3) {
      setError("You can select a maximum of 3 photos.");
    } else {
      setError("");
    }

    setPhotos((previous) => ({
      ...previous,
      [orderId]: selectedFiles.slice(0, 3),
    }));
  };

  // Remove a selected review photo.
  const removePhoto = (orderId, index) => {
    setPhotos((previous) => ({
      ...previous,
      [orderId]: (previous[orderId] || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Submit customer review.
  const submitReview = async (orderId) => {
    const form = forms[orderId] || {
      rating: 5,
      comment: "",
    };

    if (form.comment.trim().length < 3) {
      setError(
        "Please write at least 3 characters in your review."
      );
      return;
    }

    try {
      setError("");
      setMessage("");
      setSubmittingOrder(orderId);

      const formData = new FormData();

      formData.append("order_id", orderId);
      formData.append("rating", Number(form.rating));
      formData.append("comment", form.comment.trim());

      (photos[orderId] || []).forEach((photo) => {
        formData.append("photos", photo);
      });

      await api.post("/reviews", formData);

      setReviewedOrders((previous) => [
        ...previous,
        orderId,
      ]);

      setPhotos((previous) => ({
        ...previous,
        [orderId]: [],
      }));

      setMessage(
        "Thank you! Your review was submitted successfully."
      );
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSubmittingOrder(null);
    }
  };

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-3xl font-bold">My Orders</h1>

      <Message>{error}</Message>

      {message && (
        <p className="text-green-700">{message}</p>
      )}

      {orders.length === 0 ? (
        <Empty>No orders found in your account.</Empty>
      ) : (
        orders.map((o) => (
          <div
            key={o.id}
            className="stitch p-4 space-y-3"
          >
            {/* Order information */}
            <div className="flex justify-between items-center gap-2">
              <b>#{o.id} · {o.category}</b>
              <StatusBadge status={o.status} />
            </div>

            <p className="text-sm">
              Creator: {o.creator_name} · Qty: {o.quantity}
              {" · "}Budget: ₹{o.budget}
            </p>

            <p className="text-sm text-plum/80">
              {o.requirements}
            </p>

            {/* AI design preview */}
            {o.preview_image && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Your AI Design Preview
                </h3>

                <img
                  src={o.preview_image}
                  alt={`AI design preview for order ${o.id}`}
                  className="w-full max-w-sm rounded-xl border object-contain"
                />

                <p className="text-xs text-gray-500">
                  Reference image for your custom handmade order
                </p>
              </div>
            )}

            {/* Order tracking */}
            <div className="border-t pt-3 space-y-3">
              <button
                type="button"
                className="btn"
                onClick={() => toggleTracking(o.id)}
              >
                {expandedOrders[o.id]
                  ? "Hide Tracking History"
                  : "Track This Order"}
              </button>

              {expandedOrders[o.id] && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold">
                      Order Tracking Timeline
                    </h3>

                    <button
                      type="button"
                      className="text-sm text-plum font-semibold underline disabled:opacity-50"
                      disabled={trackingLoading[o.id]}
                      onClick={() => fetchTracking(o.id)}
                    >
                      {trackingLoading[o.id]
                        ? "Refreshing..."
                        : "Refresh"}
                    </button>
                  </div>

                  {trackingLoading[o.id] &&
                  !tracking[o.id] ? (
                    <p className="text-sm text-gray-500">
                      Loading tracking history...
                    </p>
                  ) : !tracking[o.id] ||
                    tracking[o.id].length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No tracking history available.
                    </p>
                  ) : (
                    [...tracking[o.id]]
                      .sort(
                        (a, b) =>
                          new Date(a.created_at) -
                          new Date(b.created_at)
                      )
                      .map((entry, index, timeline) => {
                        const isLatest =
                          index === timeline.length - 1;

                        const isRejected =
                          entry.status === "Rejected";

                        const isCompleted =
                          entry.status === "Completed";

                        return (
                          <div
                            key={entry.id}
                            className="flex gap-3"
                          >
                            {/* Timeline icon and connector */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg font-bold ${
                                  isRejected
                                    ? "bg-red-100 text-red-700"
                                    : isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : isLatest
                                    ? "bg-plum text-white"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {statusIcons[entry.status] || "•"}
                              </div>

                              {index !== timeline.length - 1 && (
                                <div className="w-0.5 flex-1 min-h-8 bg-plum/30" />
                              )}
                            </div>

                            {/* Timeline details */}
                            <div
                              className={`flex-1 rounded-xl border p-3 mb-3 ${
                                isLatest
                                  ? "border-plum bg-plum/5"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex flex-wrap justify-between items-center gap-2">
                                <p className="font-semibold">
                                  {entry.status}
                                </p>

                                {isLatest && (
                                  <span className="text-xs font-semibold text-plum">
                                    Latest Update
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  entry.created_at
                                ).toLocaleString()}
                              </p>

                              {entry.note && (
                                <p className="text-sm mt-2 text-gray-700 whitespace-pre-wrap">
                                  {entry.note}
                                </p>
                              )}

                              <p className="text-xs text-gray-400 mt-2">
                                Order update
                              </p>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>

            {/* Customer review section */}
            {o.status === "Completed" && (
              <div className="border-t pt-3 space-y-3">
                {reviewedOrders.includes(o.id) ? (
                  <p className="text-green-700 font-semibold">
                    ✓ You have reviewed this order.
                  </p>
                ) : (
                  <>
                    <h3 className="font-bold">
                      Rate your experience
                    </h3>

                    <label className="block text-sm font-medium">
                      Your Rating
                    </label>

                    <select
                      className="input w-full"
                      value={forms[o.id]?.rating ?? 5}
                      onChange={(e) =>
                        updateForm(
                          o.id,
                          "rating",
                          Number(e.target.value)
                        )
                      }
                    >
                      <option value={5}>
                        ⭐⭐⭐⭐⭐ Excellent
                      </option>
                      <option value={4}>
                        ⭐⭐⭐⭐ Very Good
                      </option>
                      <option value={3}>
                        ⭐⭐⭐ Good
                      </option>
                      <option value={2}>
                        ⭐⭐ Fair
                      </option>
                      <option value={1}>
                        ⭐ Poor
                      </option>
                    </select>

                    <textarea
                      className="input w-full"
                      rows={3}
                      maxLength={1000}
                      minLength={3}
                      placeholder="Share your experience with this creator..."
                      value={forms[o.id]?.comment || ""}
                      onChange={(e) =>
                        updateForm(
                          o.id,
                          "comment",
                          e.target.value
                        )
                      }
                    />

                    {/* Review photo upload */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold">
                        Add Review Photos (Maximum 3)
                      </label>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="input w-full"
                        onChange={(e) => {
                          updatePhotos(o.id, e.target.files);
                          e.target.value = "";
                        }}
                      />

                      <p className="text-xs text-gray-500">
                        Select up to 3 JPG, PNG or WebP images.
                        Maximum 5 MB per image.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {(photos[o.id] || []).map(
                          (photo, index) => (
                            <div
                              key={`${photo.name}-${index}`}
                              className="relative"
                            >
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Review preview ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border"
                              />

                              <button
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6"
                                onClick={() =>
                                  removePhoto(o.id, index)
                                }
                              >
                                ×
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      disabled={
                        (forms[o.id]?.comment || "").trim().length < 3 ||
                        submittingOrder === o.id
                      }
                      onClick={() => submitReview(o.id)}
                    >
                      {submittingOrder === o.id
                        ? "Submitting..."
                        : "Submit Review"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
