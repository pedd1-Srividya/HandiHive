
const STORAGE_KEY = "handihive_material_cart";

// Get material cart
export const getMaterialCart = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

// Add material to cart
export const addMaterialToCart = (material) => {
  const cart = getMaterialCart();

  const existing = cart.find(
    (item) => item.material_id === material.id
  );

  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, 100);
  } else {
    cart.push({
      material_id: material.id,
      name: material.name,
      price: Number(material.price),
      image: material.image,
      quantity: 1,
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

  return cart;
};

// Update material quantity
export const updateMaterialQuantity = (id, quantity) => {
  const cart = getMaterialCart().map((item) =>
    item.material_id === id
      ? { ...item, quantity: Math.max(1, Math.min(100, Number(quantity))) }
      : item
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

  return cart;
};

// Remove material
export const removeMaterialFromCart = (id) => {
  const cart = getMaterialCart().filter(
    (item) => item.material_id !== id
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

  return cart;
};

// Clear cart
export const clearMaterialCart = () => {
  localStorage.removeItem(STORAGE_KEY);
};
