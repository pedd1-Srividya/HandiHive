
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Message, Empty } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

export default function CreatorProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [c, setC] = useState(null);
  const [items, setItems] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({
    average_rating: 0,
    total_reviews: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/creators/${id}`),
      api.get("/products", { params: { creator_id: id } }),
      api.get(`/portfolio/creator/${id}`),
      api.get(`/reviews/creator/${id}`),
      api.get(`/reviews/creator/${id}/summary`),
    ])
      .then(([a, b, d, r, s]) => {
        setC(a.data);
        setItems(b.data);
        setPortfolio(d.data);
        setReviews(r.data);
        setRatingSummary(s.data);
        setError("");
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <Message>{error}</Message>;
  if (!c) return <p>Loading creator storefront...</p>;

  const categories = [
    ...new Set(items.map((p) => p.category).filter(Boolean)),
  ];

  return (
    <div className="space-y-8">

      {/* Storefront Cover */}
      <section className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
        <div
          className="h-40 sm:h-52 bg-cover bg-center flex items-center justify-center"
          style={
            c.cover_image
              ? { backgroundImage: `url("${c.cover_image}")` }
              : {
                  backgroundImage:
                    "linear-gradient(to right, #fecdd3, #fce7f3, #ffedd5)",
                }
          }
        >
          {!c.cover_image && (
            <div className="text-center">
              <p className="text-rose-700 font-bold tracking-widest text-sm">
                HANDIHIVE
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-rose-900 mt-2">
                Handmade with Love
              </h2>
            </div>
          )}
        </div>

        {/* Creator Information */}
        <div className="px-5 sm:px-8 pb-7">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {c.profile_image ? (
              <img
                src={c.profile_image}
                alt={c.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-rose-100 border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-rose-600">
                {c.name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 pt-2 sm:pt-0">
              <p className="text-xs font-bold tracking-widest text-rose-600">
                HANDIHIVE CREATOR
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                {c.name}
              </h1>
              <p className="text-rose-600 font-semibold mt-1">
                {c.specialty}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                📍 {c.location}
              </p>
            </div>

            {user?.role === "customer" && (
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/chat?creator_id=${c.id}`}
                  className="btn inline-block text-center"
                >
                  💬 Message Creator
                </Link>

                <Link
                  to={`/custom-order?creator=${c.id}`}
                  className="btn inline-block text-center"
                >
                  Request Custom Order
                </Link>
              </div>
            )}

            {!user && (
              <Link to="/login" className="btn inline-block text-center">
                Login to Order
              </Link>
            )}
          </div>

          {/* Store Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7">
            <div className="rounded-xl bg-rose-50 p-4 text-center">
              <p className="text-2xl font-bold text-rose-700">
                {items.length}
              </p>
              <p className="text-sm text-gray-600">Products</p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">
                {categories.length}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>

            <div className="rounded-xl bg-pink-50 p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-lg font-bold text-pink-700">Handmade</p>
              <p className="text-sm text-gray-600">Made with Love</p>
            </div>
          </div>
        </div>
      </section>

      {/* About the Creator */}
      <section className="stitch rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">
          Meet the Creator
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {c.bio || "This creator loves making beautiful handmade products."}
        </p>
        <p className="text-sm text-rose-600 font-semibold">
          {c.specialty} · {c.location}
        </p>
      </section>

      {/* Customer Ratings and Reviews */}
      <section className="stitch rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-sm font-bold tracking-widest text-rose-600">
            CUSTOMER FEEDBACK
          </p>
          <h2 className="text-2xl font-bold mt-1">
            Ratings & Reviews
          </h2>
          <p className="text-gray-500 mt-1">
            See what customers say about {c.name}.
          </p>
        </div>

        <div className="rounded-xl bg-rose-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="text-4xl font-bold text-rose-700">
              {ratingSummary.average_rating.toFixed(1)} / 5
            </p>
            <p className="text-yellow-500 text-xl">
              {"★".repeat(Math.round(ratingSummary.average_rating))}
              {"☆".repeat(5 - Math.round(ratingSummary.average_rating))}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-800">
              {ratingSummary.total_reviews} Customer Reviews
            </p>
            <p className="text-sm text-gray-500">
              Based on completed customer orders
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <Empty>No reviews yet. Be the first to share your experience!</Empty>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-rose-100 rounded-xl p-4 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <h3 className="font-bold text-gray-900">
                    {review.customer_name}
                  </h3>
                  <span className="text-yellow-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {review.comment}
                </p>
                {review.photo_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {review.photo_urls.map((photoUrl, index) => (
                      <img
                        key={`${review.id}-${index}`}
                        src={`${API_ORIGIN}${photoUrl}`}
                        alt={`Review photo ${index + 1}`}
                        className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-xl border border-rose-100"
                      />
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Handmade Portfolio Gallery */}
      {portfolio.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold tracking-widest text-rose-600">
              CREATOR'S SHOWCASE
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">
              My Handmade Creations
            </h2>
            <p className="text-gray-500 mt-2">
              Explore the beautiful handmade work created by {c.name}.
            </p>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="stitch rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-56 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Gallery */}
      <section className="space-y-5">
        <div>
          <p className="text-sm font-bold tracking-widest text-rose-600">
            THE COLLECTION
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1">
            Explore Handmade Creations
          </h2>
          <p className="text-gray-500 mt-2">
            Discover unique products created by {c.name}.
          </p>
        </div>

        {items.length === 0 ? (
          <Empty>No products available yet.</Empty>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Custom Order Invitation */}
      <section className="rounded-2xl bg-gradient-to-r from-rose-100 to-orange-100 p-6 sm:p-8 text-center space-y-3">
        <h2 className="text-2xl font-bold text-rose-900">
          Have Something Special in Mind?
        </h2>
        <p className="text-gray-700">
          Request a personalized handmade creation from {c.name}.
        </p>

        {user?.role === "customer" && (
          <Link
            to={`/custom-order?creator=${c.id}`}
            className="btn inline-block"
          >
            Create a Custom Request
          </Link>
        )}

        {!user && (
          <Link to="/login" className="btn inline-block">
            Login to Get Started
          </Link>
        )}
      </section>

    </div>
  );
}
