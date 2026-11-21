
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { MATERIAL_CATEGORIES } from "../services/constants";
import { Tile, Message, Empty } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { addMaterialToCart, getMaterialCart } from "../services/materialCart";

export default function Materials() {
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [shareMessages, setShareMessages] = useState({});
  const [cartCount, setCartCount] = useState(
    getMaterialCart().reduce((sum, item) => sum + item.quantity, 0)
  );
  const [cartMessage, setCartMessage] = useState("");

  const canPurchase =
    user?.role === "customer" || user?.role === "creator";

  useEffect(() => {
    api.get("/materials", {
      params: {
        q: q || undefined,
        category: category || undefined
      }
    })
      .then((r) => {
        setItems(r.data);
        setError("");
      })
      .catch((e) => setError(errMsg(e)));
  }, [q, category]);

  const handleAddToCart = (material) => {
    const cart = addMaterialToCart(material);

    setCartCount(
      cart.reduce((sum, item) => sum + item.quantity, 0)
    );

    setCartMessage(`${material.name} added to your material cart.`);
  };

  const shareMaterial = async (e, material) => {
    e.preventDefault();
    e.stopPropagation();

    const materialUrl =
      `${window.location.origin}/material/${material.id}`;

    const shareData = {
      title: material.name,
      text: `Check out this craft material on HandiHive: ${material.name}`,
      url: materialUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);

        setShareMessages((previous) => ({
          ...previous,
          [material.id]: "Material shared successfully!"
        }));
      } else {
        await navigator.clipboard.writeText(materialUrl);

        setShareMessages((previous) => ({
          ...previous,
          [material.id]: "Material link copied!"
        }));
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(materialUrl);

          setShareMessages((previous) => ({
            ...previous,
            [material.id]: "Material link copied!"
          }));
        } catch {
          setShareMessages((previous) => ({
            ...previous,
            [material.id]: "Unable to share or copy the link."
          }));
        }
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">Craft materials</h1>

        {canPurchase && (
          <Link to="/material-cart" className="btn">
            Material Cart ({cartCount})
          </Link>
        )}
      </div>

      {cartMessage && (
        <div className="text-sm text-green-700">
          {cartMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search materials"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search materials"
        />

        <select
          className="input max-w-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Material category"
        >
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <Message>{error}</Message>

      {items.length === 0 ? (
        <Empty>No materials found.</Empty>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="stitch p-3">
              <Link
                to={`/material/${m.id}`}
                className="block"
              >
                <Tile
                  image={m.image}
                  category={m.category}
                  className="h-32"
                />

                <h3 className="mt-3 font-bold">{m.name}</h3>

                <p className="text-sm text-plum/70">
                  {m.description}
                </p>

                <p className="mt-1 font-bold">
                  ₹{m.price}
                </p>
              </Link>

              {canPurchase && (
                <button
                  type="button"
                  onClick={() => handleAddToCart(m)}
                  className="btn mt-3 w-full"
                >
                  Add to Material Cart
                </button>
              )}

              <button
                type="button"
                onClick={(e) => shareMaterial(e, m)}
                className="btn-soft mt-3 w-full"
              >
                Share Material
              </button>

              {shareMessages[m.id] && (
                <p className="mt-2 text-xs text-green-700">
                  {shareMessages[m.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
