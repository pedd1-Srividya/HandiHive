
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import {
  Camera,
  Download,
  ImagePlus,
  LoaderCircle,
  WandSparkles,
  RotateCcw,
} from "lucide-react";
import api, { errMsg } from "../services/api";

const API_ORIGIN = (api.defaults.baseURL || "http://localhost:8000/api")
  .replace(/\/api\/?$/, "");

const DEFAULT_POSITION = {
  x: 50,
  y: 55,
  scale: 1,
  rotation: 0,
};

function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function getAdjustmentKey(productId, file) {
  if (!productId || !file) return null;

  return [
    "handihive-tryon",
    productId,
    file.name,
    file.size,
    file.lastModified,
  ].join(":");
}

function loadSavedPosition(key) {
  if (!key) return null;

  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      typeof parsed.scale !== "number" ||
      typeof parsed.rotation !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function savePosition(key, position) {
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(position));
  } catch (error) {
    console.warn("Could not save try-on adjustments:", error);
  }
}

// Find visible pixels in the transparent jewellery PNG.
function getVisibleBounds(image) {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!tempCtx) return null;

  tempCanvas.width = image.naturalWidth;
  tempCanvas.height = image.naturalHeight;

  tempCtx.drawImage(image, 0, 0);

  const pixels = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  ).data;

  let minX = tempCanvas.width;
  let minY = tempCanvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < tempCanvas.height; y++) {
    for (let x = 0; x < tempCanvas.width; x++) {
      const alpha = pixels[(y * tempCanvas.width + x) * 4 + 3];

      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

// Draw only the front part of the bracelet with a 3D effect.
function drawCurvedBracelet(
  ctx,
  bracelet,
  x,
  y,
  width,
  height,
  rotation
) {
  const strips = 180;

  const layer = document.createElement("canvas");
  layer.width = Math.max(1, Math.round(width * 1.5));
  layer.height = Math.max(1, Math.round(height * 1.5));

  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return;

  const W = layer.width;
  const H = layer.height;

  const halfSourceHeight = bracelet.height / 2;
  const halfDestinationHeight = H / 2;

  // Draw only the front half, with a curved shape.
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const normalized = t * 2 - 1;
    const edge = Math.abs(normalized);
    const curve = normalized * normalized;

    const sourceX = (i / strips) * bracelet.width;
    const sourceWidth = bracelet.width / strips + 1;

    // Perspective compression at both sides.
    const perspective = 1 - edge * 0.23;
    const destinationWidth = (W / strips) * perspective;

    const destinationX =
      t * W + (W / strips - destinationWidth) / 2;

    // Preserve your adjusted vertical size.
    const verticalScale = 1.08;

    const edgeCompression = 1 - edge * 0.12;
    const stripHeight =
      halfDestinationHeight * verticalScale * edgeCompression;

    // Raise the sides to create a natural wrist curve.
    const centerY = H * 0.70 - curve * H * 0.075;

    const destinationY = centerY - stripHeight / 2;

    // Bottom half of the PNG is the visible front section.
    const sourceY = bracelet.y + halfSourceHeight;

    layerCtx.drawImage(
      bracelet.image,
      bracelet.x + sourceX,
      sourceY,
      sourceWidth,
      halfSourceHeight,
      destinationX,
      destinationY,
      destinationWidth + 1,
      stripHeight
    );
  }

  // Add realistic side shading and central highlights.
  layerCtx.save();
  layerCtx.globalCompositeOperation = "source-atop";

  const sideShading = layerCtx.createLinearGradient(0, 0, W, 0);

  sideShading.addColorStop(0, "rgba(0,0,0,0.30)");
  sideShading.addColorStop(0.18, "rgba(0,0,0,0.10)");
  sideShading.addColorStop(0.40, "rgba(255,255,255,0.08)");
  sideShading.addColorStop(0.52, "rgba(255,255,255,0.18)");
  sideShading.addColorStop(0.68, "rgba(255,255,255,0.06)");
  sideShading.addColorStop(0.85, "rgba(0,0,0,0.12)");
  sideShading.addColorStop(1, "rgba(0,0,0,0.30)");

  layerCtx.fillStyle = sideShading;
  layerCtx.fillRect(0, 0, W, H);

  // Vertical lighting.
  const verticalLighting = layerCtx.createLinearGradient(0, 0, 0, H);

  verticalLighting.addColorStop(0, "rgba(0,0,0,0.12)");
  verticalLighting.addColorStop(0.35, "rgba(255,255,255,0.08)");
  verticalLighting.addColorStop(0.65, "rgba(255,255,255,0.12)");
  verticalLighting.addColorStop(1, "rgba(0,0,0,0.20)");

  layerCtx.fillStyle = verticalLighting;
  layerCtx.fillRect(0, 0, W, H);

  layerCtx.restore();

  // Create shadow from the visible front section only.
  const shadow = document.createElement("canvas");
  shadow.width = W;
  shadow.height = H;

  const shadowCtx = shadow.getContext("2d");
  if (!shadowCtx) return;

  shadowCtx.drawImage(layer, 0, 0);

  shadowCtx.globalCompositeOperation = "source-in";
  shadowCtx.fillStyle = "rgba(35, 23, 20, 0.65)";
  shadowCtx.fillRect(0, 0, W, H);

  // Position and rotate bracelet.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Soft shadow underneath the bracelet.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.filter = "blur(5px)";

  ctx.drawImage(
    shadow,
    -width / 2,
    -height / 2 + 4,
    width,
    height
  );

  ctx.restore();

  // Close contact shadow.
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.filter = "blur(1.5px)";

  ctx.drawImage(
    shadow,
    -width / 2,
    -height / 2 + 1,
    width,
    height
  );

  ctx.restore();

  // Draw final curved bracelet.
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = "none";

  ctx.drawImage(
    layer,
    -width / 2,
    -height / 2,
    width,
    height
  );

  ctx.restore();
  ctx.restore();
}

export default function VirtualTryOn() {
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const photoImageRef = useRef(null);
  const jewelleryImageRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [jewelleryUrl, setJewelleryUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [handDetected, setHandDetected] = useState(false);

  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [autoPosition, setAutoPosition] = useState(null);

  const selectedProduct = products.find(
    (product) => product.id === Number(selectedId)
  );

  const adjustmentKey = getAdjustmentKey(selectedId, photoFile);

  // Load jewellery products.
  useEffect(() => {
    let active = true;

    api.get("/products")
      .then((response) => {
        if (!active) return;

        const jewelleryProducts = response.data.filter((product) => {
          const category = (product.category || "").toLowerCase();

          return (
            product.try_on_image &&
            /(jewel|jewell|bracelet|bangle|anklet)/i.test(category)
          );
        });

        setProducts(jewelleryProducts);

        if (jewelleryProducts.length) {
          setSelectedId(String(jewelleryProducts[0].id));
        }
      })
      .catch((err) => {
        if (active) setError(errMsg(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Release old uploaded photo URLs.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // Restore saved adjustments.
  useEffect(() => {
    if (!adjustmentKey) return;

    const saved = loadSavedPosition(adjustmentKey);

    if (saved) {
      setPosition(saved);
      setMessage("Your saved adjustments have been restored.");
    } else if (autoPosition) {
      setPosition(autoPosition);
      setMessage("Automatic wrist placement restored.");
    } else {
      setPosition(DEFAULT_POSITION);
    }
  }, [adjustmentKey]);

  // Load selected jewellery image.
  useEffect(() => {
    let active = true;

    jewelleryImageRef.current = null;
    setJewelleryUrl("");

    if (!selectedProduct?.try_on_image) return;

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (!active) return;

      jewelleryImageRef.current = image;
      setJewelleryUrl(assetUrl(selectedProduct.try_on_image));
      setError("");
    };

    image.onerror = () => {
      if (active) {
        setError("Could not load this jewellery image.");
      }
    };

    image.src = assetUrl(selectedProduct.try_on_image);

    return () => {
      active = false;
    };
  }, [selectedProduct]);

  // Draw photo and jewellery.
  useEffect(() => {
    const canvas = canvasRef.current;
    const photo = photoImageRef.current;
    const jewellery = jewelleryImageRef.current;

    if (!canvas || !photo || !photo.complete || !photo.naturalWidth) {
      return;
    }

    const maxWidth = 1100;
    const ratio = Math.min(1, maxWidth / photo.naturalWidth);

    canvas.width = Math.round(photo.naturalWidth * ratio);
    canvas.height = Math.round(photo.naturalHeight * ratio);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    if (!jewellery || !jewellery.complete || !jewellery.naturalWidth) {
      return;
    }

    const bounds = getVisibleBounds(jewellery);
    if (!bounds) return;

    const centerX = (position.x / 100) * canvas.width;
    const centerY = (position.y / 100) * canvas.height;

    const baseWidth = Math.min(canvas.width, canvas.height) * 0.24;
    const visibleWidth = baseWidth * position.scale;

    const visibleHeight =
      visibleWidth * (bounds.height / bounds.width);

    const bracelet = {
      image: jewellery,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    drawCurvedBracelet(
      ctx,
      bracelet,
      centerX,
      centerY,
      visibleWidth,
      visibleHeight,
      position.rotation
    );
  }, [photoUrl, jewelleryUrl, position]);

  // Update position and save adjustments.
  const updatePosition = (changes) => {
    setPosition((previous) => {
      const updated = {
        ...previous,
        ...changes,
      };

      savePosition(adjustmentKey, updated);
      return updated;
    });
  };

  // Reset to detected placement.
  const resetToDetectedPosition = () => {
    if (!autoPosition) {
      setMessage("Detect your hand first to get an automatic position.");
      return;
    }

    setPosition(autoPosition);
    savePosition(adjustmentKey, autoPosition);
    setMessage("Restored automatic wrist placement.");
  };

  // Initialize MediaPipe.
  const initializeLandmarker = async () => {
    if (handLandmarkerRef.current) {
      return handLandmarkerRef.current;
    }

    setModelLoading(true);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          runningMode: "IMAGE",
          numHands: 2,
        }
      );

      handLandmarkerRef.current = landmarker;
      return landmarker;
    } finally {
      setModelLoading(false);
    }
  };

  // Release MediaPipe.
  useEffect(() => {
    return () => {
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
    };
  }, []);

  // Upload hand photo.
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please select an image smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      photoImageRef.current = image;

      setPhotoUrl(url);
      setPhotoFile(file);
      setHandDetected(false);
      setAutoPosition(null);

      const key = getAdjustmentKey(selectedId, file);
      const saved = loadSavedPosition(key);

      setPosition(saved || DEFAULT_POSITION);
      setError("");

      setMessage(
        saved
          ? "Your saved adjustments for this photo have been restored."
          : "Photo loaded. Detect your hand to place the bracelet."
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Could not open this photo.");
    };

    image.src = url;
  };

  // Detect hand and calculate wrist placement.
  const detectHand = async () => {
    const photo = photoImageRef.current;

    if (!photo) {
      setError("Upload a hand or wrist photo first.");
      return;
    }

    if (!jewelleryImageRef.current) {
      setError("Please wait for the jewellery image to finish loading.");
      return;
    }

    setError("");
    setMessage("");
    setDetecting(true);

    try {
      const landmarker = await initializeLandmarker();
      const result = landmarker.detect(photo);

      if (!result.landmarks?.length) {
        setHandDetected(false);

        setError(
          "No hand detected. Try a clear photo with your wrist visible, or adjust the bracelet manually."
        );

        return;
      }

      const landmarks = result.landmarks[0];

      const wrist = landmarks[0];
      const indexMcp = landmarks[5];
      const middleMcp = landmarks[9];
      const ringMcp = landmarks[13];
      const pinkyMcp = landmarks[17];

      // Estimate palm center.
      const palmCenterX =
        (indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 4;

      const palmCenterY =
        (indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 4;

      const directionX = palmCenterX - wrist.x;
      const directionY = palmCenterY - wrist.y;

      // Place bracelet close to wrist crease.
      const wristPosition = 0.12;

      const centerX =
        (wrist.x + directionX * wristPosition) * 100;

      const centerY =
        (wrist.y + directionY * wristPosition) * 100;

      // Calculate angle across hand.
      const acrossX =
        (pinkyMcp.x - indexMcp.x) * photo.naturalWidth;

      const acrossY =
        (pinkyMcp.y - indexMcp.y) * photo.naturalHeight;

      const angle =
        Math.atan2(acrossY, acrossX) * (180 / Math.PI);

      // Estimate wrist width.
      const palmWidth = Math.hypot(acrossX, acrossY);
      const estimatedWristWidth = palmWidth * 0.66;

      const baseWidth =
        Math.min(photo.naturalWidth, photo.naturalHeight) * 0.24;

      const scale = Math.max(
        0.3,
        Math.min(2.5, (estimatedWristWidth / baseWidth) * 1.25)
      );

      const detectedPosition = {
        x: centerX,
        y: centerY,
        scale,
        rotation: angle,
      };

      setAutoPosition(detectedPosition);
      setPosition(detectedPosition);
      savePosition(adjustmentKey, detectedPosition);

      setHandDetected(true);

      setMessage(
        "Hand detected! Bracelet placement is ready. Fine-tune it using the sliders if needed."
      );
    } catch (error) {
      console.error("Hand detection error:", error);

      setError(
        error.message || "Hand detection could not be completed."
      );
    } finally {
      setDetecting(false);
    }
  };

  // Download preview.
  const downloadPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement("a");
      link.download = "handihive-virtual-try-on.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Preview download error:", error);

      setError(
        "Could not download the preview. Check whether the jewellery image allows cross-origin access."
      );
    }
  };

  if (loading) {
    return (
      <p className="text-center py-10">
        Loading jewellery products...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
          HandiHive AI Experience
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          Virtual Jewellery Try-On
        </h1>

        <p className="text-plum/70 max-w-2xl mx-auto">
          See how handmade jewellery looks on your wrist before purchasing.
          Upload a photo and try your favourite creator's design.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn">
          <ImagePlus size={17} className="inline mr-2" />
          Photo Try-On
        </button>

        <button
          className="btn-soft"
          type="button"
          disabled
          title="Live camera mode is coming in the next implementation step."
        >
          <Camera size={17} className="inline mr-2" />
          Live Camera - Coming Next
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 text-rose-700 p-3">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl bg-green-50 text-green-800 p-3">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 items-start">
        <section className="stitch p-5 space-y-4">
          <h2 className="text-xl font-bold">
            1. Choose jewellery
          </h2>

          {products.length === 0 ? (
            <div className="rounded-xl bg-lav-100 p-4 text-sm">
              No jewellery products with try-on images are available yet.
              Creators must upload transparent PNG images in their dashboard.
            </div>
          ) : (
            <>
              <select
                className="input w-full"
                value={selectedId}
                onChange={(event) => {
                  const nextId = event.target.value;

                  setSelectedId(nextId);
                  setHandDetected(false);
                  setAutoPosition(null);

                  const key = getAdjustmentKey(nextId, photoFile);
                  const saved = loadSavedPosition(key);

                  setPosition(saved || DEFAULT_POSITION);

                  setMessage(
                    saved
                      ? "Saved adjustments restored for this bracelet."
                      : "Select Detect Hand to place this bracelet automatically."
                  );
                }}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Rs. {product.price}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="rounded-xl border border-lav-300 p-3 flex gap-3 items-center">
                  <img
                    src={assetUrl(selectedProduct.try_on_image)}
                    alt={selectedProduct.name}
                    className="w-20 h-20 object-contain bg-white rounded-lg"
                  />

                  <div>
                    <p className="font-bold">
                      {selectedProduct.name}
                    </p>

                    <p className="text-sm text-plum/70">
                      {selectedProduct.category}
                    </p>

                    <p className="font-semibold">
                      Rs. {selectedProduct.price}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="border-t border-lav-300 pt-4 space-y-3">
            <h2 className="text-xl font-bold">
              2. Upload your hand photo
            </h2>

            <p className="text-sm text-plum/70">
              Choose a clear photo with your wrist visible. Your photo is
              processed locally in your browser.
            </p>

            <input
              type="file"
              accept="image/*"
              className="input w-full"
              onChange={handlePhotoChange}
            />

            <button
              type="button"
              className="btn w-full"
              onClick={detectHand}
              disabled={!photoFile || detecting || modelLoading}
            >
              {detecting || modelLoading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="inline mr-2 animate-spin"
                  />
                  Detecting hand...
                </>
              ) : (
                <>
                  <WandSparkles size={17} className="inline mr-2" />
                  Detect Hand & Place Jewellery
                </>
              )}
            </button>
          </div>

          <div className="border-t border-lav-300 pt-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-xl font-bold">
                3. Adjust placement
              </h2>

              <button
                type="button"
                className="btn-soft text-sm"
                onClick={resetToDetectedPosition}
                disabled={!autoPosition}
              >
                <RotateCcw size={15} className="inline mr-1" />
                Reset to detected
              </button>
            </div>

            <label className="block text-sm font-medium">
              Horizontal position: {position.x.toFixed(0)}%
            </label>

            <input
              type="range"
              min="0"
              max="100"
              value={position.x}
              onChange={(event) =>
                updatePosition({
                  x: Number(event.target.value),
                })
              }
              className="w-full"
            />

            <label className="block text-sm font-medium">
              Vertical position: {position.y.toFixed(0)}%
            </label>

            <input
              type="range"
              min="0"
              max="100"
              value={position.y}
              onChange={(event) =>
                updatePosition({
                  y: Number(event.target.value),
                })
              }
              className="w-full"
            />

            <label className="block text-sm font-medium">
              Jewellery size: {position.scale.toFixed(1)}x
            </label>

            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={position.scale}
              onChange={(event) =>
                updatePosition({
                  scale: Number(event.target.value),
                })
              }
              className="w-full"
            />

            <label className="block text-sm font-medium">
              Rotation: {position.rotation.toFixed(0)}°
            </label>

            <input
              type="range"
              min="-180"
              max="180"
              value={position.rotation}
              onChange={(event) =>
                updatePosition({
                  rotation: Number(event.target.value),
                })
              }
              className="w-full"
            />

            {handDetected && (
              <p className="text-sm text-green-700">
                Hand landmarks detected successfully.
              </p>
            )}

            <p className="text-xs text-plum/60">
              Your manual adjustments are saved in this browser for the
              selected bracelet and photo.
            </p>
          </div>
        </section>

        <section className="stitch p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-bold">
              Your try-on preview
            </h2>

            <button
              type="button"
              className="btn-soft"
              onClick={downloadPreview}
              disabled={!photoUrl || !jewelleryUrl}
            >
              <Download size={16} className="inline mr-2" />
              Save Preview
            </button>
          </div>

          <div className="min-h-80 rounded-xl bg-lav-100 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto object-contain"
              />
            ) : (
              <div className="text-center p-8 text-plum/60">
                <ImagePlus size={45} className="mx-auto mb-3" />

                <p>
                  Upload a hand photo to see your jewellery preview.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-plum/60">
            This is a simulated visual preview, not a guarantee of exact
            real-world fit. Adjust the position and size for a better result.
          </p>
        </section>
      </div>
    </div>
  );
}
