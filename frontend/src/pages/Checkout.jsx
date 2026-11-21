
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { Message } from "../components/ui";

export default function Checkout() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "Cash on Delivery",
  });

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await api.get("/cart");
        setItems(res.data);

        if (res.data.length === 0) {
          navigate("/cart");
        }
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\d{6,10}$/.test(form.pincode)) {
      setError("Please enter a valid PIN code.");
      return;
    }

    try {
      setPlacing(true);

      const res = await api.post("/cart/checkout", form);

      navigate("/my-purchases", {
        state: {
          success: true,
          orderId: res.data.id,
        },
      });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading checkout...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-gray-500 mb-6">
        Enter your delivery details to place your order.
      </p>

      {error && <Message>{error}</Message>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="stitch rounded-xl p-6">
            <h2 className="text-xl font-bold mb-5">
              Delivery Information
            </h2>

            <form onSubmit={placeOrder} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  required
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Delivery Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House number, street, area"
                  required
                  minLength={5}
                  className="w-full border rounded-lg p-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    City
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    minLength={2}
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    State
                  </label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    minLength={2}
                    className="w-full border rounded-lg p-3"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Enter PIN code"
                  maxLength={10}
                  required
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Payment Method
                </label>

                <div className="border rounded-lg p-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked
                      readOnly
                    />
                    <span>
                      <strong>Cash on Delivery</strong>
                      <span className="block text-sm text-gray-500">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing || items.length === 0}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {placing ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="stitch rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Order Summary
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-3 py-2 border-b"
              >
                <span className="text-sm">
                  {item.product.name} × {item.quantity}
                </span>

                <span className="font-medium whitespace-nowrap">
                  ₹
                  {(
                    Number(item.product.price) * item.quantity
                  ).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-lg mt-4">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <p className="text-sm text-gray-500 mt-3">
              Payment will be collected through Cash on Delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
