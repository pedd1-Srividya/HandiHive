
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Tile, Message } from "../components/ui";

export default function ProductDetail() {
  const { id } = useParams();

  const [p, setP] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setP(null);
    setError("");

    api.get(`/products/${id}`)
      .then((r) => setP(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <Message>{error}</Message>;
  if (!p) return <p>Loading product...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">

      {/* Product Image */}
      <div className="stitch p-3 bg-white">
        <Tile
          image={p.image}
          category={p.category}
          className="h-96 md:h-[500px]"
        />
      </div>

      {/* Product Information */}
      <div className="space-y-4">

        <p className="text-sm font-semibold text-rose-600 uppercase tracking-wide">
          {p.category}
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          {p.name}
        </h1>

        <p className="text-3xl font-bold text-plum">
          ₹{p.price}
        </p>

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
