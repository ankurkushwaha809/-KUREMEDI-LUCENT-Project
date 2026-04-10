import React, { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useContextApi } from "../../hooks/useContextApi";
import toast from "react-hot-toast";
import { resolveUploadUrl } from "../../lib/baseUrl";
import { getErrorMessage } from "../../utils/errorHandler";

const MAX_BANNER_FILE_MB = 8;
const MAX_BANNER_FILE_BYTES = MAX_BANNER_FILE_MB * 1024 * 1024;
const BANNER_MAX_DIMENSION = 1920;
const BANNER_JPEG_QUALITY = 0.82;
const ACCEPTED_BANNER_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });

const optimizeBannerImage = async (file) => {
  const mime = String(file?.type || "").toLowerCase();
  if (!mime.startsWith("image/")) return file;
  if (mime === "image/gif" || mime === "image/heic" || mime === "image/heif") return file;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(dataUrl);
    const width = Number(image.naturalWidth || image.width || 0);
    const height = Number(image.naturalHeight || image.height || 0);
    if (!width || !height) return file;

    const scale = Math.min(1, BANNER_MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    const compressedBlob = await canvasToBlob(canvas, "image/jpeg", BANNER_JPEG_QUALITY);
    if (!compressedBlob || compressedBlob.size >= file.size) return file;

    const nextName = String(file.name || "banner").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([compressedBlob], nextName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
};

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState("Banners");
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerName, setBannerName] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [bannerTargetType, setBannerTargetType] = useState("none");
  const [targetProductId, setTargetProductId] = useState("");
  const [customRedirectUrl, setCustomRedirectUrl] = useState("");
  const [ctaText, setCtaText] = useState("Shop now");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [subtitleColor, setSubtitleColor] = useState("#e2e8f0");
  const [buttonColor, setButtonColor] = useState("#0f172a");
  const [useProductNameAsTitle, setUseProductNameAsTitle] = useState(true);
  const [products, setProducts] = useState([]);
  const [bannerError, setBannerError] = useState("");
  const [processingBannerFile, setProcessingBannerFile] = useState(false);
  const bannerFileInputRef = useRef(null);

  const {
    getMarketingBanners,
    createMarketingBanner,
    updateMarketingBanner,
    deleteMarketingBanner,
    getProducts,
  } = useContextApi();

  const getBannerImageUrl = (path) => {
    if (!path) return "";
    return resolveUploadUrl(path);
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await getMarketingBanners();
      setBanners(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      const message = getErrorMessage(error);
      setBannerError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Banners") {
      loadBanners();
      loadProducts();
    }
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      if (res?.success && Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (Array.isArray(res)) {
        setProducts(res);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    }
  };

  const buildRedirectUrl = () => {
    if (bannerTargetType === "product") {
      return targetProductId ? `/products/${targetProductId}` : "";
    }
    if (bannerTargetType === "custom") {
      return customRedirectUrl.trim();
    }
    return "";
  };

  const selectedProduct = products.find((p) => p._id === targetProductId);
  const resolvedTitle = useProductNameAsTitle && selectedProduct
    ? String(selectedProduct.productName || selectedProduct.name || "").trim()
    : title.trim();

  const handleBannerFileChange = async (event) => {
    setBannerError("");
    const incomingFile = event.target.files?.[0] || null;
    if (!incomingFile) {
      setBannerFile(null);
      return;
    }

    const mime = String(incomingFile.type || "").toLowerCase();
    if (!ACCEPTED_BANNER_TYPES.includes(mime)) {
      const message = "Unsupported banner format. Use JPG, PNG, or WEBP.";
      setBannerFile(null);
      setBannerError(message);
      toast.error(message);
      event.target.value = "";
      return;
    }

    setProcessingBannerFile(true);
    const optimizedFile = await optimizeBannerImage(incomingFile);
    setProcessingBannerFile(false);

    if (Number(optimizedFile.size || 0) > MAX_BANNER_FILE_BYTES) {
      const message = `Banner image is too large. Keep it under ${MAX_BANNER_FILE_MB}MB.`;
      setBannerFile(null);
      setBannerError(message);
      toast.error(message);
      event.target.value = "";
      return;
    }

    setBannerFile(optimizedFile);
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    setBannerError("");
    if (!bannerName.trim()) return toast.error("Banner name is required");
    const selectedFile = bannerFile || bannerFileInputRef.current?.files?.[0] || null;
    if (!selectedFile) return toast.error("Please choose an image");
    if (bannerTargetType === "product" && !targetProductId) {
      return toast.error("Please select a product for redirection");
    }
    if (bannerTargetType === "custom" && !customRedirectUrl.trim()) {
      return toast.error("Please enter a redirect URL/path");
    }
    setSubmitting(true);
    try {
      await createMarketingBanner({
        name: bannerName.trim(),
        image: selectedFile,
        isActive,
        redirectUrl: buildRedirectUrl(),
        ctaText: ctaText.trim() || "Shop now",
        title: resolvedTitle,
        subtitle: subtitle.trim(),
        textColor,
        subtitleColor,
        buttonColor,
      });
      setBannerName("");
      setBannerFile(null);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = "";
      }
      setIsActive(true);
      setBannerTargetType("none");
      setTargetProductId("");
      setCustomRedirectUrl("");
      setCtaText("Shop now");
      setTitle("");
      setSubtitle("");
      setTextColor("#ffffff");
      setSubtitleColor("#e2e8f0");
      setButtonColor("#0f172a");
      setUseProductNameAsTitle(true);
      toast.success("Banner uploaded");
      await loadBanners();
    } catch (error) {
      const message = getErrorMessage(error);
      setBannerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await updateMarketingBanner(banner._id, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b)));
    } catch (error) {
      const message = getErrorMessage(error);
      setBannerError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this banner?");
    if (!ok) return;
    try {
      await deleteMarketingBanner(id);
      setBanners((prev) => prev.filter((b) => b._id !== id));
      toast.success("Banner deleted");
    } catch (error) {
      const message = getErrorMessage(error);
      setBannerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Marketing Tools
          </h1>
          <p className="text-gray-500">
            Manage campaigns, banners, offers, and notifications
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-100">
            <Download size={16} />
            Export Data
          </button>

          <button
            onClick={() => setActiveTab("Banners")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <ImagePlus size={16} />
            Manage Banners
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-6 border-b mb-6">
        {["Campaigns", "Banners", "Offers & Schemes", "Push Notifications"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition
                ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {activeTab === "Banners" ? (
        <div className="space-y-6">
          <form onSubmit={handleCreateBanner} className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Website Banner</h2>
            {bannerError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {bannerError}
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Banner Name</label>
                <input
                  type="text"
                  value={bannerName}
                  onChange={(e) => setBannerName(e.target.value)}
                  placeholder="e.g. Summer Stock Sale"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Image</label>
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  onClick={(e) => {
                    e.currentTarget.value = "";
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-red-500 font-semibold">Recommended banner size: 1920 x 720 (Width x Height)</p>
                <p className="mt-1 text-xs text-gray-600">Max file size: {MAX_BANNER_FILE_MB}MB</p>
                {processingBannerFile ? (
                  <p className="mt-1 text-xs text-blue-600">Optimizing image for faster upload...</p>
                ) : null}
              </div>
              <div className="flex items-end justify-between border rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">Show on website</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Click action</label>
                <select
                  value={bannerTargetType}
                  onChange={(e) => setBannerTargetType(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="none">No redirect</option>
                  <option value="product">Open product page</option>
                  <option value="custom">Open custom URL/path</option>
                </select>
              </div>

              {bannerTargetType === "product" ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Select product</label>
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Choose a product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {(p.productName || p.name || "Product")} ({p._id})
                      </option>
                    ))}
                  </select>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={useProductNameAsTitle}
                      onChange={(e) => setUseProductNameAsTitle(e.target.checked)}
                    />
                    Use selected product name as banner heading
                  </label>
                </div>
              ) : null}

              {bannerTargetType === "custom" ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Redirect URL / Path</label>
                  <input
                    type="text"
                    value={customRedirectUrl}
                    onChange={(e) => setCustomRedirectUrl(e.target.value)}
                    placeholder="/products/abc123 or https://example.com/page"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700">Button text on banner</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  maxLength={40}
                  placeholder="Shop now"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Banner content design</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Header text</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    placeholder="Mega healthcare sale"
                    disabled={useProductNameAsTitle && bannerTargetType === "product"}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Subheader description</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    maxLength={140}
                    placeholder="Flat discounts with fast delivery"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Text color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="mt-1 h-10 w-full border rounded-lg px-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subheader color</label>
                  <input
                    type="color"
                    value={subtitleColor}
                    onChange={(e) => setSubtitleColor(e.target.value)}
                    className="mt-1 h-10 w-full border rounded-lg px-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Button color</label>
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="mt-1 h-10 w-full border rounded-lg px-1"
                  />
                </div>
                <div className="lg:col-span-2 rounded-lg border border-gray-200 p-3 bg-white">
                  <p className="text-xs text-gray-500 mb-1">Live text preview</p>
                  <p className="text-lg font-bold" style={{ color: textColor }}>
                    {resolvedTitle || "Your banner heading"}
                  </p>
                  <p className="text-sm mt-1" style={{ color: subtitleColor }}>
                    {subtitle || "Your subheader description appears here"}
                  </p>
                  <span
                    className="mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: buttonColor, color: "#ffffff" }}
                  >
                    {ctaText || "Shop now"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={submitting || processingBannerFile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                <Plus size={16} />
                {processingBannerFile ? "Optimizing..." : submitting ? "Uploading..." : "Upload Banner"}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Uploaded Banners ({banners.length})</h3>
              <button onClick={loadBanners} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading banners...</p>
            ) : banners.length === 0 ? (
              <p className="text-sm text-gray-500">No banners yet. Upload first banner to start website slider.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {banners.map((banner) => (
                  <div key={banner._id} className="rounded-xl border border-gray-200 overflow-hidden">
                    <img
                      src={getBannerImageUrl(banner.image)}
                      alt={banner.name}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-3 space-y-2">
                      <p className="font-medium text-gray-900 truncate">{banner.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        Target: {banner.redirectUrl ? banner.redirectUrl : "No redirect"}
                      </p>
                      <p className="text-xs text-gray-500">Button: {banner.ctaText || "Shop now"}</p>
                      <p className="text-xs text-gray-500 truncate">Header: {banner.title || "-"}</p>
                      <p className="text-xs text-gray-500 truncate">Subheader: {banner.subtitle || "-"}</p>
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={!!banner.isActive}
                            onChange={() => handleToggleActive(banner)}
                          />
                          Active
                        </label>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete banner"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 text-gray-600 text-sm">
          This section is coming soon.
        </div>
      )}
    </div>
  );
};

export default Campaigns;
