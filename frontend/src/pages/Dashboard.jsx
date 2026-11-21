import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import api, { errMsg } from "../services/api";
import { PRODUCT_CATEGORIES, STATUSES } from "../services/constants";
import { Field, Message, Empty, StatusBadge } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const cid = user?.creator_id;

  const [tab, setTab] = useState("Orders");

  const TABS = ["Orders", "Regular Purchases", "Products", "Portfolio", "Profile", "Reviews", "AI assistant", "Stats"]

  if (!cid) {
    return <p>Creator profile not found. Please log in again.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-plum/70">
          Welcome, {user.name}! Manage your handmade business here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${
              tab === t
                ? "bg-plum text-cream border-plum"
                : "bg-white border-lav-300 hover:bg-lav-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Orders" && <OrdersTab />}

      {tab === "Regular Purchases" && <RegularPurchasesTab />}

      {tab === "Products" && <ProductsTab cid={cid} />}

      {tab === "Portfolio" && <PortfolioTab cid={cid} />}

      {tab === "Profile" && <ProfileTab />}

      {tab === "Reviews" && <ReviewsTab cid={cid} />}

      {tab === "AI assistant" && <AITab />}

      {tab === "Stats" && <StatsTab cid={cid} />}
    </div>
  );
}




function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusNotes, setStatusNotes] = useState({});

  const load = async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
      setError("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    try {
      const note = (statusNotes[id] || "").trim();

      await api.patch(`/orders/${id}/status`, {
        status,
        note,
      });

      setStatusNotes((previous) => ({
        ...previous,
        [id]: "",
      }));

      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">
        Customer Order Requests
      </h2>

      <Message>{error}</Message>

      {orders.length === 0 && (
        <Empty>No custom order requests yet.</Empty>
      )}

      {orders.map((o) => (
        <div key={o.id} className="stitch p-4 space-y-3">
          <div className="flex justify-between items-center gap-2">
            <b>
              #{o.id} · {o.category} for {o.customer_name}
            </b>
            <StatusBadge status={o.status} />
          </div>

          <p className="text-sm">{o.requirements}</p>

          <p className="text-sm text-plum/70">
            {[o.material, o.colour, o.size]
              .filter(Boolean)
              .join(" · ")}
            {" · "}Qty: {o.quantity}
            {" · "}Budget: ₹{o.budget}
          </p>

          <p className="text-sm">
            Customer email: {o.customer_email}
          </p>

          {o.design_description && (
            <p className="text-sm italic">
              {o.design_description}
            </p>
          )}

          {o.preview_image && (
            <div className="space-y-2">
              <h3 className="font-semibold">
                Customer's AI Design Preview
              </h3>

              <img
                src={o.preview_image}
                alt={`Customer design preview for order ${o.id}`}
                className="w-full max-w-sm rounded-xl border object-contain"
              />

              <p className="text-xs text-gray-500">
                Use this image as a visual reference when creating the product.
              </p>
            </div>
          )}

          {/* Progress note for customer */}
          <div className="space-y-1">
            <label className="text-sm font-semibold">
              Progress update for customer (optional)
            </label>

            <textarea
              className="input w-full"
              rows={2}
              maxLength={500}
              placeholder="Example: Your bracelet is being handmade. Expected to finish soon."
              value={statusNotes[o.id] || ""}
              onChange={(e) =>
                setStatusNotes((previous) => ({
                  ...previous,
                  [o.id]: e.target.value,
                }))
              }
            />

            <p className="text-xs text-gray-500">
              This update will appear in the customer's order tracking history when you change the status.
            </p>
          </div>

          {/* Order status controls */}
          <div className="flex flex-wrap gap-2 items-center">
            {o.status === "Pending" ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setStatus(o.id, "Accepted")}
                >
                  Accept
                </button>

                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => setStatus(o.id, "Rejected")}
                >
                  Reject
                </button>
              </>
            ) : (
              <select
                className="input w-auto"
                value={o.status}
                onChange={(e) =>
                  setStatus(o.id, e.target.value)
                }
                aria-label="Update order status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


function ProductsTab({ cid }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tryOnFile, setTryOnFile] = useState(null);
  const [tryOnPreview, setTryOnPreview] = useState("");
  const [uploadingTryOn, setUploadingTryOn] = useState(false);

  const emptyForm = {
    name: "",
    category: "",
    price: "",
    description: "",
    material: "",
    colour: "",
    image: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products", {
        params: { creator_id: cid },
      });
      setProducts(response.data);
      setError("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [cid]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleTryOnImageChange = (e) => {
  	const file = e.target.files?.[0];

  	if (!file) return;

  	if (file.type !== "image/png") {
    		setError("Please select a PNG image.");
    		e.target.value = "";
    		return;
  	}

  	if (file.size > 5 * 1024 * 1024) {
    		setError("PNG image must be 5 MB or less.");
    		e.target.value = "";
    		return;
  	}

  	setError("");
  	setTryOnFile(file);
  	setTryOnPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
  	e.preventDefault();
  	setError("");
  	setMessage("");

  	const productData = {
    		...form,
    		price: Number(form.price),
    		creator_id: cid,
  	};

  	try {
    		let productId;

    		if (editingId) {
      			const response = await api.put(
        				`/products/${editingId}`,
        			productData
      			);

      			productId = response.data.id;
      			setMessage("Product updated successfully!");
    			} else {
      				const response = await api.post("/products", productData);

      				productId = response.data.id;
      				setMessage("Product added successfully!");
    			}

    			if (tryOnFile) {
      				setUploadingTryOn(true);

      				const uploadData = new FormData();
      				uploadData.append("file", tryOnFile);

      				await api.post(
        				`/products/${productId}/try-on-image`,
        				uploadData
      				);

      				setMessage("Product saved and try-on image uploaded successfully!");
    			}

    			setForm(emptyForm);
    			setEditingId(null);
    			setTryOnFile(null);
    			setTryOnPreview("");

    			await loadProducts();
  		} catch (err) {
    			setError(errMsg(err));
  		} finally {
    			setUploadingTryOn(false);
  		}
	};

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      description: product.description || "",
      material: product.material || "",
      colour: product.colour || "",
      image: product.image || "",
    });
    setMessage("");
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted successfully!");
      await loadProducts();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (loading) {
    return <p>Loading your products...</p>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Manage Your Products</h2>

      <Message>{error}</Message>
      {message && <p className="text-green-700">{message}</p>}

      <form onSubmit={handleSubmit} className="stitch p-4 space-y-3">
        <h3 className="font-bold">
          {editingId ? "Edit Product" : "Add New Product"}
        </h3>

        <input
          className="input w-full"
          name="name"
          placeholder="Product name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          className="input w-full"
          name="category"
          placeholder="Category (e.g. Crochet, Jewellery, Crafts)"
          value={form.category}
          onChange={handleChange}
          required
        />

        <input
          className="input w-full"
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Price in ₹"
          value={form.price}
          onChange={handleChange}
          required
        />

        <textarea
          className="input w-full"
          name="description"
          placeholder="Product description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />

        <input
          className="input w-full"
          name="material"
          placeholder="Material used"
          value={form.material}
          onChange={handleChange}
        />

        <input
          className="input w-full"
          name="colour"
          placeholder="Colour"
          value={form.colour}
          onChange={handleChange}
        />

        <input
          className="input w-full"
          name="image"
          placeholder="Product image URL"
          value={form.image}
          onChange={handleChange}
        />

        <div className="space-y-2">
  		<label className="block text-sm font-semibold">
    			Jewellery Try-On Image (Transparent PNG)
  		</label>

  		<p className="text-xs text-plum/70">
    			Upload a transparent PNG of the jewellery for virtual try-on.
    			Keep the jewellery centered with minimal empty space.
    			Maximum size: 5 MB.
  		</p>

  		<input
    			className="input w-full"
    			type="file"
    			accept="image/png"
    			onChange={handleTryOnImageChange}
  		/>

  		{tryOnPreview && (
    			<div className="w-36 h-36 rounded-xl border border-lav-300 p-2 bg-white">
      				<img
        				src={tryOnPreview}
        				alt="Try-on jewellery preview"
        				className="w-full h-full object-contain"
      				/>
    			</div>
  		)}

  		{!tryOnPreview && editingId && (
    			<p className="text-xs text-plum/70">
      				Select a new PNG to replace the current try-on image.
    			</p>
  		)}
	</div>

        <div className="flex flex-wrap gap-2">
          <button
  		type="submit"
  		className="btn"
  		disabled={uploadingTryOn}
	  >
  		{uploadingTryOn
    			? "Uploading Try-On Image..."
    			: editingId
      				? "Update Product"
      				: "Add Product"}
	  </button>

          {editingId && (
            <button
              type="button"
              className="btn-soft"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setTryOnFile(null);
		setTryOnPreview("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold">Your Products ({products.length})</h3>

        {products.length === 0 && (
          <Empty>You haven't added any products yet.</Empty>
        )}

        {products.map((product) => (
          <div key={product.id} className="stitch p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-sm text-plum/70">
                  {product.category} · ₹{product.price}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {product.description && (
              <p className="text-sm">{product.description}</p>
            )}

            {product.material && (
              <p className="text-sm text-plum/70">
                Material: {product.material}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



function ProfileTab() {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    specialty: "",
    location: "",
    profile_image: "",
    cover_image: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/auth/me")
      .then(async (response) => {
        const user = response.data;

        if (!user.creator_id) {
          throw new Error("Creator profile not found.");
        }

        const creatorResponse = await api.get(
          `/creators/${user.creator_id}`
        );

        setProfile({
          name: creatorResponse.data.name || "",
          bio: creatorResponse.data.bio || "",
          specialty: creatorResponse.data.specialty || "",
          location: creatorResponse.data.location || "",
          profile_image: creatorResponse.data.profile_image || "",
          cover_image: creatorResponse.data.cover_image || "",
        });
      })
      .catch((err) => setError(errMsg(err) || err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.put("/creators/me", profile);

      setProfile({
        name: response.data.name || "",
        bio: response.data.bio || "",
        specialty: response.data.specialty || "",
        location: response.data.location || "",
        profile_image: response.data.profile_image || "",
        cover_image: response.data.cover_image || "",
      });

      setMessage("Your creator profile has been updated!");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading your profile...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-xl font-bold">Manage Your Creator Profile</h2>

      <Message>{error}</Message>

      {message && <p className="text-green-700">{message}</p>}

      <form onSubmit={handleSubmit} className="stitch p-5 space-y-4">

        <Field label="Creator Name">
          <input
            className="input w-full"
            name="name"
            value={profile.name}
            onChange={handleChange}
            minLength={2}
            maxLength={100}
            required
          />
        </Field>

        <Field label="About You">
          <textarea
            className="input w-full"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            maxLength={1000}
            rows={4}
          />
        </Field>

        <Field label="Handmade Specialty">
          <input
            className="input w-full"
            name="specialty"
            value={profile.specialty}
            onChange={handleChange}
            minLength={2}
            maxLength={100}
            required
          />
        </Field>

        <Field label="Location">
          <input
            className="input w-full"
            name="location"
            value={profile.location}
            onChange={handleChange}
            maxLength={150}
          />
        </Field>

        <Field label="Profile Image URL">
          <input
            className="input w-full"
            type="url"
            name="profile_image"
            value={profile.profile_image}
            onChange={handleChange}
            placeholder="https://example.com/profile.jpg"
            maxLength={500}
          />
        </Field>

        {profile.profile_image && (
          <img
            src={profile.profile_image}
            alt="Profile preview"
            className="w-28 h-28 rounded-full object-cover border-2 border-rose-200"
          />
        )}

        <Field label="Storefront Cover Image URL">
          <input
            className="input w-full"
            type="url"
            name="cover_image"
            value={profile.cover_image}
            onChange={handleChange}
            placeholder="https://example.com/cover.jpg"
            maxLength={500}
          />
        </Field>

        {profile.cover_image && (
          <div className="space-y-2">
            <p className="font-semibold text-sm">Cover Image Preview</p>
            <img
              src={profile.cover_image}
              alt="Storefront cover preview"
              className="w-full h-40 rounded-xl object-cover border border-rose-200"
            />
          </div>
        )}

        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>

      </form>
    </div>
  );
}



function PortfolioTab({ cid }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/portfolio/creator/${cid}`);
      setItems(response.data);
      setError("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [cid]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId !== null) {
        await api.put(`/portfolio/${editingId}`, {
          title,
          description,
          image,
        });

        setMessage("Portfolio item updated successfully!");
      } else {
        await api.post("/portfolio/", {
          title,
          description,
          image,
        });

        setMessage("Portfolio item added successfully!");
      }

      resetForm();
      await loadPortfolio();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || "");
    setImage(item.image);
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this portfolio item?")) {
      return;
    }

    try {
      await api.delete(`/portfolio/${id}`);
      setMessage("Portfolio item deleted successfully!");

      if (editingId === id) {
        resetForm();
      }

      await loadPortfolio();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (loading) {
    return <p>Loading your portfolio...</p>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">My Handmade Portfolio</h2>

      <p className="text-sm text-plum/70">
        Showcase your handmade creations, even if they are not available for sale.
      </p>

      <Message>{error}</Message>

      {message && (
        <p className="text-green-700">{message}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="stitch p-4 space-y-3"
      >
        <h3 className="font-bold">
          {editingId !== null
            ? "Edit Portfolio Creation"
            : "Add a Portfolio Creation"}
        </h3>

        <input
          className="input w-full"
          placeholder="Creation title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={2}
          maxLength={150}
          required
        />

        <textarea
          className="input w-full"
          placeholder="Describe your handmade creation"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
        />

        <input
          className="input w-full"
          type="url"
          placeholder="Image URL (https://...)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          maxLength={500}
          required
        />

        {image && (
          <img
            src={image}
            alt="Portfolio preview"
            className="w-full max-w-xs h-48 object-cover rounded-xl"
          />
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Portfolio"
                : "Add to Portfolio"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="btn-soft"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold">
          My Creations ({items.length})
        </h3>

        {items.length === 0 && (
          <Empty>
            No portfolio creations yet. Add your first handmade creation!
          </Empty>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="stitch overflow-hidden"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-3 space-y-2">
                <h4 className="font-bold">{item.title}</h4>

                {item.description && (
                  <p className="text-sm text-plum/70">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn-soft flex items-center gap-2"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ---------------- AI ASSISTANT TAB ----------------


function AITab() {
  const [activeTool, setActiveTool] = useState("description");

  const [form, setForm] = useState({
    name: "",
    category: "Crochet",
    material: "",
    colour: "",
    details: "",
    platform: "Instagram",
    tone: "Creative",
  });

  const [priceForm, setPriceForm] = useState({
    material_cost: "",
    labour_cost: "",
    other_cost: "0",
    hours_required: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updatePriceField = (field, value) => {
    setPriceForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let endpoint;
      let payload;

      if (activeTool === "description") {
        endpoint = "/ai/describe";
        payload = form;
      } else if (activeTool === "caption") {
        endpoint = "/ai/caption";
        payload = form;
      } else {
        endpoint = "/ai/price-recommendation";

        payload = {
          name: form.name,
          category: form.category,
          material_cost: Number(priceForm.material_cost),
          labour_cost: Number(priceForm.labour_cost),
          other_cost: Number(priceForm.other_cost),
          hours_required: Number(priceForm.hours_required),
        };
      }

      const response = await api.post(endpoint, payload);
      setResult(response.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const switchTool = (tool) => {
    setActiveTool(tool);
    setResult(null);
    setError("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">✨ AI Creator Assistant</h2>
        <p className="text-sm text-plum/70 mt-1">
          Create product descriptions, social media content and
          smart price recommendations for your handmade business.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={activeTool === "description" ? "btn" : "btn-soft"}
          onClick={() => switchTool("description")}
        >
          Product Description
        </button>

        <button
          type="button"
          className={activeTool === "caption" ? "btn" : "btn-soft"}
          onClick={() => switchTool("caption")}
        >
          Social Media Caption
        </button>

        <button
          type="button"
          className={activeTool === "price" ? "btn" : "btn-soft"}
          onClick={() => switchTool("price")}
        >
          💰 Price Recommendation
        </button>
      </div>

      <form onSubmit={generate} className="stitch p-5 space-y-4">
        <h3 className="font-bold text-lg">
          {activeTool === "description"
            ? "✨ AI Product Description Generator"
            : activeTool === "caption"
              ? "✨ AI Social Media Caption Generator"
              : "💰 AI Handmade Product Price Recommendation"}
        </h3>

        <div>
          <label className="block text-sm font-medium mb-1">
            Product Name
          </label>
          <input
            className="input w-full"
            placeholder="Example: Crochet Flower Bouquet"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            minLength={2}
            maxLength={150}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            className="input w-full"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
          >
            <option>Crochet</option>
            <option>Bracelets</option>
            <option>Jewellery</option>
            <option>Pipe Cleaner Crafts</option>
            <option>Embroidery</option>
            <option>Painting</option>
            <option>Personalized Gifts</option>
            <option>Other Handmade Crafts</option>
          </select>
        </div>

        {activeTool !== "price" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Material
                </label>
                <input
                  className="input w-full"
                  placeholder="Cotton yarn, beads..."
                  value={form.material}
                  onChange={(e) => updateField("material", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Colour
                </label>
                <input
                  className="input w-full"
                  placeholder="Pink, cream..."
                  value={form.colour}
                  onChange={(e) => updateField("colour", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Details
              </label>
              <textarea
                className="input w-full"
                rows={3}
                placeholder="Describe your handmade product..."
                value={form.details}
                onChange={(e) => updateField("details", e.target.value)}
              />
            </div>
          </>
        )}

        {activeTool === "caption" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Social Media Platform
              </label>
              <select
                className="input w-full"
                value={form.platform}
                onChange={(e) => updateField("platform", e.target.value)}
              >
                <option>Instagram</option>
                <option>Facebook</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Caption Tone
              </label>
              <select
                className="input w-full"
                value={form.tone}
                onChange={(e) => updateField("tone", e.target.value)}
              >
                <option>Cute</option>
                <option>Professional</option>
                <option>Creative</option>
                <option>Friendly</option>
              </select>
            </div>
          </>
        )}

        {activeTool === "price" && (
          <div className="space-y-4">
            <p className="text-sm text-plum/70">
              Enter your product-making expenses to calculate a
              suggested selling price.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Material Cost (₹)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="150"
                  min="0"
                  step="0.01"
                  required
                  value={priceForm.material_cost}
                  onChange={(e) =>
                    updatePriceField("material_cost", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Labour Cost (₹)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="100"
                  min="0"
                  step="0.01"
                  required
                  value={priceForm.labour_cost}
                  onChange={(e) =>
                    updatePriceField("labour_cost", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Other Expenses (₹)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="Packaging, etc."
                  min="0"
                  step="0.01"
                  required
                  value={priceForm.other_cost}
                  onChange={(e) =>
                    updatePriceField("other_cost", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Time Required (Hours)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="2"
                  min="0"
                  step="0.5"
                  required
                  value={priceForm.hours_required}
                  onChange={(e) =>
                    updatePriceField("hours_required", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="rounded-xl bg-rose-50 p-4 text-sm text-gray-700">
              <strong>Pricing method:</strong> HandiHive calculates
              your production cost and applies a 20% markup for
              the initial recommended price. Labour cost should
              already account for your working time.
            </div>
          </div>
        )}

        <Message>{error}</Message>

        <button
          type="submit"
          className="btn"
          disabled={loading}
        >
          {loading
            ? "Generating..."
            : activeTool === "description"
              ? "✨ Generate Description"
              : activeTool === "caption"
                ? "✨ Generate Caption"
                : "💰 Recommend Product Price"}
        </button>
      </form>

      {result && (
        <div className="stitch p-5 space-y-4">
          {activeTool === "price" ? (
            <>
              <h3 className="font-bold text-lg text-rose-700">
                💰 Your Price Recommendation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Total Production Cost</p>
                  <p className="text-xl font-bold">
                    ₹{result.total_cost.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Minimum Price</p>
                  <p className="text-xl font-bold">
                    ₹{result.minimum_price.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-sm text-gray-500">Recommended Price</p>
                  <p className="text-2xl font-bold text-rose-700">
                    ₹{result.recommended_price.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Estimated Profit</p>
                  <p className="text-xl font-bold text-green-700">
                    ₹{result.estimated_profit.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-xl font-bold">
                  {result.profit_margin.toFixed(2)}%
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">
                  AI Pricing Explanation
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Mode: {result.mode}
                <p>{result.note}</p>
              </div>

              <button
                type="button"
                className="btn-soft"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Product: ${form.name}\nTotal Cost: ₹${result.total_cost}\nMinimum Price: ₹${result.minimum_price}\nRecommended Price: ₹${result.recommended_price}\nEstimated Profit: ₹${result.estimated_profit}\nProfit Margin: ${result.profit_margin}%\n\n${result.explanation}`
                  )
                }
              >
                Copy Price Recommendation
              </button>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg text-rose-700">
                Generated Content
              </h3>

              {activeTool === "description" ? (
                <p className="text-gray-700 leading-relaxed">
                  {result.description}
                </p>
              ) : (
                <>
                  <div>
                    <h4 className="font-semibold">Caption</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {result.caption}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Hashtags</h4>
                    <p className="text-rose-600">
                      {result.hashtags.join(" ")}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Promotional Message</h4>
                    <p className="text-gray-700">
                      {result.promotional_text}
                    </p>
                  </div>
                </>
              )}

              <div className="text-xs text-gray-500">
                Mode: {result.mode}
                <p>{result.note}</p>
              </div>

              <button
                type="button"
                className="btn-soft"
                onClick={() => {
                  const content =
                    activeTool === "description"
                      ? result.description
                      : `${result.caption}\n\n${result.hashtags.join(" ")}\n\n${result.promotional_text}`;

                  navigator.clipboard.writeText(content);
                }}
              >
                Copy Generated Content
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}



// ---------------- CREATOR STATS TAB ----------------

function StatsTab({ cid }) {
  const [stats, setStats] = useState({
    customOrders: [],
    purchases: [],
    products: [],
    portfolio: [],
    reviews: [],
    totalSales: 0,
    unitsSold: 0,
    purchaseOrders: 0,
    monthlySales: [],
    topProducts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          api.get("/orders"),
          api.get("/cart/creator-purchases"),
          api.get("/products", {
            params: { creator_id: cid },
          }),
          api.get(`/portfolio/creator/${cid}`),
          api.get(`/reviews/creator/${cid}`),
        ]);

        const getData = (result) =>
          result.status === "fulfilled" &&
          Array.isArray(result.value.data)
            ? result.value.data
            : [];

        const customOrders = getData(results[0]);
        const purchases = getData(results[1]);
        const products = getData(results[2]);
        const portfolio = getData(results[3]);
        const reviews = getData(results[4]);

        const failedRequests = results.filter(
          (result) => result.status === "rejected"
        );

        if (failedRequests.length > 0) {
          setError(
            "Some analytics could not be loaded. Please refresh and try again."
          );
        }

        // Calculate product sales and quantity sold
        let totalSales = 0;
        let unitsSold = 0;

        const productSales = {};

        purchases.forEach((order) => {
          (order.items || []).forEach((item) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const amount = price * quantity;

            totalSales += amount;
            unitsSold += quantity;

            const name = item.product_name || "Unknown Product";

            if (!productSales[name]) {
              productSales[name] = {
                name,
                quantity: 0,
                sales: 0,
              };
            }

            productSales[name].quantity += quantity;
            productSales[name].sales += amount;
          });
        });

        // Top-selling products
        const topProducts = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        // Last six months of product sales
        const monthlySales = [];

        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setDate(1);
          date.setMonth(date.getMonth() - i);

          const year = date.getFullYear();
          const month = date.getMonth();

          const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

          monthlySales.push({
            month: date.toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            key: monthKey,
            sales: 0,
          });
        }

        purchases.forEach((order) => {
          if (!order.created_at) return;

          const date = new Date(order.created_at);

          if (Number.isNaN(date.getTime())) return;

          const key = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          const month = monthlySales.find(
            (item) => item.key === key
          );

          if (month) {
            (order.items || []).forEach((item) => {
              month.sales +=
                Number(item.price || 0) *
                Number(item.quantity || 0);
            });
          }
        });

        // Average customer rating
        const averageRating =
          reviews.length > 0
            ? reviews.reduce(
                (total, review) =>
                  total + Number(review.rating || 0),
                0
              ) / reviews.length
            : 0;

        setStats({
          customOrders,
          purchases,
          products,
          portfolio,
          reviews,
          totalSales,
          unitsSold,
          purchaseOrders: purchases.length,
          monthlySales,
          topProducts,
          averageRating,
        });
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [cid]);

  if (loading) {
    return <p>Loading your business analytics...</p>;
  }

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // Custom order status breakdown
  const statusNames = [
    "Pending",
    "Accepted",
    "In Progress",
    "Completed",
    "Rejected",
  ];

  const statusData = statusNames
    .map((status) => ({
      name: status,
      value: stats.customOrders.filter(
        (order) => order.status === status
      ).length,
    }))
    .filter((item) => item.value > 0);

  const completedOrders = stats.customOrders.filter(
    (order) => order.status === "Completed"
  ).length;

  const pendingOrders = stats.customOrders.filter(
    (order) => order.status === "Pending"
  ).length;

  const acceptedOrders = stats.customOrders.filter(
    (order) => order.status === "Accepted"
  ).length;

  const rejectedOrders = stats.customOrders.filter(
    (order) => order.status === "Rejected"
  ).length;

  const cards = [
    {
      label: "Custom Orders",
      value: stats.customOrders.length,
      icon: "📩",
    },
    {
      label: "Regular Purchases",
      value: stats.purchaseOrders,
      icon: "🛍️",
    },
    {
      label: "Total Products",
      value: stats.products.length,
      icon: "🎁",
    },
    {
      label: "Portfolio Creations",
      value: stats.portfolio.length,
      icon: "🎨",
    },
    {
      label: "Product Sales",
      value: formatCurrency(stats.totalSales),
      icon: "💰",
    },
    {
      label: "Units Sold",
      value: stats.unitsSold,
      icon: "📦",
    },
    {
      label: "Average Rating",
      value: `${Number(stats.averageRating || 0).toFixed(1)} / 5`,
      icon: "⭐",
    },
    {
      label: "Customer Reviews",
      value: stats.reviews.length,
      icon: "💬",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          📊 Creator Business Analytics
        </h2>

        <p className="text-sm text-plum/70 mt-1">
          Track your handmade business performance and sales.
        </p>
      </div>

      {error && <Message>{error}</Message>}

      {/* BUSINESS OVERVIEW CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="stitch p-5 rounded-xl text-center space-y-2"
          >
            <p className="text-3xl">{card.icon}</p>

            <p className="text-2xl font-bold text-rose-700">
              {card.value}
            </p>

            <p className="text-sm text-gray-600">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* CUSTOM ORDER SUMMARY */}

      <div className="stitch rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold">
          Custom Order Summary
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Pending", pendingOrders],
            ["Accepted", acceptedOrders],
            ["Completed", completedOrders],
            ["Rejected", rejectedOrders],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white rounded-lg p-4 text-center border border-plum/10"
            >
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MONTHLY SALES CHART */}

      <div className="stitch rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold">
            Monthly Product Sales
          </h3>

          <p className="text-sm text-plum/70">
            Your product sales over the last six months.
          </p>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => formatCurrency(value)}
              />

              <Bar
                dataKey="sales"
                fill="#9d648c"
                name="Product Sales"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CUSTOM ORDER STATUS CHART */}

      <div className="stitch rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold">
          Custom Order Status Distribution
        </h3>

        {statusData.length === 0 ? (
          <Empty>No custom order data available yet.</Empty>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        "#d69aaf",
                        "#9d648c",
                        "#b49acb",
                        "#78a88b",
                        "#d77d7d",
                      ][index % 5]}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS */}

      <div className="stitch rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold">
          🏆 Top-Selling Products
        </h3>

        {stats.topProducts.length === 0 ? (
          <Empty>No product sales yet.</Empty>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex flex-wrap justify-between items-center gap-3 border-b border-plum/10 pb-3"
              >
                <div>
                  <p className="font-semibold">
                    {index + 1}. {product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {product.quantity} units sold
                  </p>
                </div>

                <p className="font-bold text-rose-700">
                  {formatCurrency(product.sales)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IMPORTANT NOTE */}

      <p className="text-xs text-gray-500">
        Note: Product sales represent the gross value of your regular
        product purchases, not your final profit. Custom order budgets
        are not included in product sales.
      </p>
    </div>
  );
}

// ---------------- REGULAR PURCHASES TAB ----------------


function RegularPurchasesTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingItem, setUpdatingItem] = useState(null);

  const statusOptions = [
    "Accepted",
    "Rejected",
    "In Progress",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Completed",
    "Delivered",
    "Cancelled",
  ];

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart/creator-purchases");
      setOrders(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load regular purchases."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadItemTracking = async (orderId, itemId) => {
    try {
      const response = await api.get(
        `/tracking/product/${orderId}?item_id=${itemId}`
      );

      const history = response.data;

      setTracking((prev) => ({
        ...prev,
        [itemId]: history,
      }));

      if (history.length > 0) {
        setSelectedStatuses((prev) => ({
          ...prev,
          [itemId]: history[history.length - 1].status,
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load product tracking history."
      );
    }
  };

  const toggleTracking = async (orderId, itemId) => {
    const isOpen = expandedItems[itemId];

    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !isOpen,
    }));

    if (!isOpen && !tracking[itemId]) {
      await loadItemTracking(orderId, itemId);
    }
  };

  const updateItemStatus = async (orderId, itemId) => {
    try {
      setUpdatingItem(itemId);
      setError("");

      const status = selectedStatuses[itemId] || "Packed";

      await api.patch(
        `/cart/creator-purchases/${orderId}/items/${itemId}/status`,
        {
          status,
          note: "Product purchase status updated",
        }
      );

      await loadItemTracking(orderId, itemId);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update product status."
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  if (loading) {
    return <p>Loading regular purchases...</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">
          Regular Product Purchases
        </h2>
        <p className="text-sm text-plum/70 mt-1">
          Orders placed by customers through the shopping cart.
        </p>
      </div>

      {error && <Message>{error}</Message>}

      {!error && orders.length === 0 && (
        <Empty>No regular purchases yet.</Empty>
      )}

      {orders.map((order) => {
        const myItems = order.items || [];

        const subtotal = myItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return (
          <div
            key={order.id}
            className="stitch rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">
                  Order #{order.id}
                </h3>
                <p className="text-sm text-plum/70">
                  {order.customer_name}
                </p>
                <p className="text-sm text-plum/70">
                  {order.customer_email}
                </p>
              </div>

              <div className="text-sm">
                <p>
                  <strong>Order Status:</strong> {order.status}
                </p>
                <p>
                  <strong>Payment:</strong> {order.payment_status}
                </p>
                <p>
                  <strong>Method:</strong> {order.payment_method}
                </p>
              </div>
            </div>

            <div className="border-t border-plum/20 pt-3 space-y-4">
              <h4 className="font-semibold">
                Purchased Products
              </h4>

              {myItems.map((item) => {
                const history = tracking[item.id] || [];

                const currentStatus =
                  history.length > 0
                    ? history[history.length - 1].status
                    : "Placed";

                return (
                  <div
                    key={item.id}
                    className="border border-plum/20 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">
                        {item.product_name} × {item.quantity}
                      </span>

                      <span>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-sm">
                      <strong>Product Status:</strong> {currentStatus}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={selectedStatuses[item.id] || "Packed"}
                        onChange={(e) =>
                          setSelectedStatuses((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="border border-plum/30 rounded-lg px-3 py-2 text-sm"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          updateItemStatus(order.id, item.id)
                        }
                        disabled={updatingItem === item.id}
                        className="px-4 py-2 rounded-lg bg-plum text-white text-sm disabled:opacity-50"
                      >
                        {updatingItem === item.id
                          ? "Updating..."
                          : "Update Status"}
                      </button>

                      <button
                        onClick={() =>
                          toggleTracking(order.id, item.id)
                        }
                        className="px-4 py-2 rounded-lg border border-plum text-plum text-sm"
                      >
                        {expandedItems[item.id]
                          ? "Hide Tracking History"
                          : "View Tracking History"}
                      </button>
                    </div>

                    {expandedItems[item.id] && (
                      <div className="border-t border-plum/20 pt-3 space-y-3">
                        <h5 className="font-semibold">
                          Order Tracking Timeline
                        </h5>

                        {history.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No tracking history available yet.
                          </p>
                        ) : (
                          history.map((entry) => (
                            <div
                              key={entry.id}
                              className="border-l-2 border-plum pl-3 py-1"
                            >
                              <p className="font-semibold">
                                {entry.status}
                              </p>

                              <p className="text-xs text-gray-500">
                                {new Date(
                                  entry.created_at
                                ).toLocaleString()}
                              </p>

                              {entry.note && (
                                <p className="text-sm">
                                  {entry.note}
                                </p>
                              )}

                              <p className="text-xs text-gray-500">
                                Updated by user #{entry.updated_by_user_id}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-plum/20 pt-3 space-y-1 text-sm">
              <p>
                <strong>Your Product Subtotal:</strong>{" "}
                ₹{subtotal.toFixed(2)}
              </p>
              <p>
                <strong>Phone:</strong> {order.phone}
              </p>
              <p>
                <strong>Delivery Address:</strong>{" "}
                {order.address}, {order.city}, {order.state} -{" "}
                {order.pincode}
              </p>
              <p>
                <strong>Order Date:</strong>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}

      <button
        onClick={loadPurchases}
        className="px-4 py-2 rounded-lg bg-plum text-white"
      >
        Refresh Purchases
      </button>
    </div>
  );
}


// ---------------- REVIEWS TAB ----------------

function ReviewsTab({ cid }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/reviews/creator/${cid}`
        );

        setReviews(response.data);
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [cid]);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <div className="space-y-5">

      <h2 className="text-2xl font-bold">
        Customer Reviews
      </h2>

      {error && <Message>{error}</Message>}

      <div className="stitch rounded-2xl p-5">
        <p className="text-gray-500">
          Your Average Rating
        </p>

        <p className="text-4xl font-bold text-rose-600">
          {averageRating} / 5
        </p>

        <p className="text-yellow-500 text-xl">
          {"★".repeat(Math.round(Number(averageRating)))}
          {"☆".repeat(5 - Math.round(Number(averageRating)))}
        </p>

        <p className="text-sm text-gray-500">
          Based on {reviews.length} customer reviews
        </p>
      </div>

      {reviews.length === 0 ? (
        <Empty>No customer reviews yet.</Empty>
      ) : (
        reviews.map((review) => (
          <div
            key={review.id}
            className="stitch rounded-2xl p-5 space-y-3"
          >
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold">
                  {review.customer_name}
                </h3>

                <p className="text-yellow-500">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-gray-700">
              {review.comment}
            </p>

            {review.photo_urls?.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {review.photo_urls.map((photo, index) => (
                  <img
                    key={`${review.id}-${index}`}
                    src={`${(
                      import.meta.env.VITE_API_URL ||
                      "http://localhost:8000/api"
                    ).replace(/\/api\/?$/, "")}${photo}`}
                    alt={`Customer review ${index + 1}`}
                    className="w-28 h-28 object-cover rounded-xl border"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">
              Order #{review.order_id}
            </p>
          </div>
        ))
      )}

    </div>
  );
}

