
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import AIDescriptionGenerator from "./components/AIDescriptionGenerator";
import AICaptionGenerator from "./components/AICaptionGenerator";

import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CreatorProfile from "./pages/CreatorProfile";
import Materials from "./pages/Materials";
import CustomOrder from "./pages/CustomOrder";
import MyOrders from "./pages/MyOrders";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/creator/:id" element={<CreatorProfile />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/custom-order" element={<CustomOrder />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>

      {/* AI Product Description Generator */}
      <AIDescriptionGenerator />

      {/* AI Social Media Caption Generator */}
      <AICaptionGenerator />

      <footer className="text-center text-sm text-plum/60 pb-8">
        HandiHive – Create. Connect. Grow. Sample products are demo data.
      </footer>
    </>
  );
}
