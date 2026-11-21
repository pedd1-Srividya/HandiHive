
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AIDescriptionGenerator from "./components/AIDescriptionGenerator";
import AICaptionGenerator from "./components/AICaptionGenerator";

import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CreatorProfile from "./pages/CreatorProfile";
import Materials from "./pages/Materials";
import MaterialDetail from "./pages/MaterialDetail";
import CustomOrder from "./pages/CustomOrder";
import MyOrders from "./pages/MyOrders";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyPurchases from "./pages/MyPurchases";
import Chat from "./pages/Chat";
import MyMaterialOrders from "./pages/MyMaterialOrders";
import MaterialCart from "./pages/MaterialCart";
import MaterialCheckout from "./pages/MaterialCheckout";
import AICustomDesign from "./pages/AICustomDesign";
import VirtualTryOn from "./pages/VirtualTryOn";

export default function App() {
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/creator/:id" element={<CreatorProfile />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/material/:id" element={<MaterialDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer-only pages */}
          <Route
            path="/custom-order"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomOrder />
              </ProtectedRoute>
            }
          />
           
           <Route
  	     path="/ai-custom-design"
  	     element={
    	       <ProtectedRoute allowedRoles={["customer"]}>
                  <AICustomDesign />
               </ProtectedRoute>
             }
           />	
  
           <Route
  		path="/virtual-try-on"
  		element={
    			<ProtectedRoute allowedRoles={["customer"]}>
      				<VirtualTryOn />
    			</ProtectedRoute>
  		}
	    />  

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-purchases"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <MyPurchases />
              </ProtectedRoute>
            }
          />

          {/* Customer and Creator Material Shopping */}
          <Route
            path="/material-cart"
            element={
              <ProtectedRoute allowedRoles={["customer", "creator"]}>
                <MaterialCart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/material-checkout"
            element={
              <ProtectedRoute allowedRoles={["customer", "creator"]}>
                <MaterialCheckout />
              </ProtectedRoute>
            }
          />

          {/* Customer and Creator Material Orders */}
          <Route
            path="/my-material-orders"
            element={
              <ProtectedRoute allowedRoles={["customer", "creator"]}>
                <MyMaterialOrders />
              </ProtectedRoute>
            }
          />

          {/* Customer and Creator Chat */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["customer", "creator"]}>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Creator-only page */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["creator"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin-only page */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Page not found */}
          <Route
            path="*"
            element={<p>Page not found.</p>}
          />
        </Routes>
      </main>

      <AIDescriptionGenerator />
      <AICaptionGenerator />

      <footer className="text-center text-sm text-plum/60 pb-8">
        HandiHive – Create. Connect. Grow. Sample products are demo data.
      </footer>
    </>
  );
}
