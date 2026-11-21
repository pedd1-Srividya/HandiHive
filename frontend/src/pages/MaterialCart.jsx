
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getMaterialCart,
  updateMaterialQuantity,
  removeMaterialFromCart,
} from "../services/materialCart";

export default function MaterialCart() {
  const [items, setItems] = useState(getMaterialCart());

  const updateQuantity = (id, quantity) => {
    setItems(updateMaterialQuantity(id, quantity));
  };

  const removeItem = (id) => {
    setItems(removeMaterialFromCart(id));
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-5">
      <h1 className="text-3xl font-bold">Material Cart</h1>

      {items.length === 0 ? (
        <div className="stitch rounded-xl p-8 text-center space-y-4">
          <p>Your material cart is empty.</p>
          <Link to="/materials" className="btn inline-block">
            Browse Materials
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.material_id}
                className="stitch rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center"
              >
                <div className="flex-1 w-full">
                  <h2 className="font-bold text-lg">{item.name}</h2>
                  <p className="text-plum/70">
                    ₹{Number(item.price).toFixed(2)} each
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label htmlFor={`quantity-${item.material_id}`}>
                    Quantity
                  </label>

                  <input
                    id={`quantity-${item.material_id}`}
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.material_id, e.target.value)
                    }
                    className="input w-20"
                  />
                </div>

                <p className="font-bold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem(item.material_id)}
                  className="btn-soft"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="stitch rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">
                ₹{total.toFixed(2)}
              </p>
            </div>

            <Link to="/material-checkout" className="btn">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
