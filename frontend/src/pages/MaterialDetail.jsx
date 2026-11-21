
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Tile, Message } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { addMaterialToCart, getMaterialCart } from "../services/materialCart";

export default function MaterialDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [material, setMaterial] = useState(null);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [cartCount, setCartCount] = useState(
    getMaterialCart().reduce((sum, item) => sum + item.quantity, 0)
  );

  const canPurchase =
    user?.role === "customer" || user?.role === "creator";

  useEffect(() => {
    setMaterial(null);
    setError("");

    api.get(`/materials/${id}`)
      .then((response) => setMaterial(response.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  const handleAddToCart = () => {
    const cart = addMaterialToCart(material);

    setCartCount(
      cart.reduce((sum, item) => sum + item.quantity, 0)
    );

    setCartMessage(`${material.name} added to your material cart.`);
  };

  const shareMaterial = async () => {
    const materialUrl =
      `${window.location.origin}/material/${material.id}`;

    const shareData = {
      title: material.name,
      text: `Check out this craft material on HandiHive: ${material.name}`,
      url: materialUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("Material shared successfully!");
      } else {
        await navigator.clipboard.writeText(materialUrl);
        setShareMessage("Material link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(materialUrl);
          setShareMessage("Material link copied!");
        } catch {
          setShareMessage("Unable to share or copy the link.");
        }
      }
    }
  };

  if (error) return <Message>{error}</Message>;
  if (!material) return <p>Loading material...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="stitch p-3 bg-white">
        <Tile
          image={material.image}
          category={material.category}
          className="h-96 md:h-[500px]"
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-rose-600 uppercase">
          {material.category}
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          {material.name}
        </h1>

        <p className="text-3xl font-bold text-plum">
          ₹{material.price}
        </p>

        <div className="border-t border-lav-200 pt-4">
          <h2 className="font-bold text-lg mb-2">
            Material Description
          </h2>

          <p className="text-plum/80 leading-relaxed">
            {material.description || "No description available."}
          </p>
        </div>

        {canPurchase && (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn w-full"
            >
              Add to Material Cart
            </button>

            <Link
              to="/material-cart"
              className="btn-soft inline-block w-full text-center"
            >
              View Material Cart ({cartCount})
            </Link>
          </>
        )}

        {cartMessage && (
          <p className="text-sm text-green-700">
            {cartMessage}
          </p>
        )}

        <button
          type="button"
          onClick={shareMaterial}
          className="btn-soft"
        >
          Share Material
        </button>

        {shareMessage && (
          <p className="text-sm text-green-700">
            {shareMessage}
          </p>
        )}

        <Link to="/materials" className="btn inline-block">
          Back to Materials
        </Link>
      </div>
    </div>
  );
}
