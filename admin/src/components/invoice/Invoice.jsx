import React, { useRef, useState, useEffect } from "react";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const productsData = {
  simple: {
    title: "Bath Tub – Simple Tub",
    amount: "17000",
    features: [
      "Deep Model Simple Tub (Top Model Lucite Acrylic + Glass Fiber)",
      "Sleek Head rest Pillow (Black)",
      "Pop Drain With Pipe (Brass with Chrome)",
      "Height Adjusted Legs",
    ],
  },
  "simple-with-panel": {
    title: "Bath Tub – Simple Tub with Panel",
    amount: "28000",
    features: [
      "Simple Tub with Panel (Top Model Lucite Acrylic + Glass Fiber)",
      "Head rest Pillows (Black)",
      "Pop Drain With Pipe (Brass with Chrome)",
      "Height Adjusted Legs",
      "Complete Stainless Steel Stand (Jindal304)",
      "Front and Side Panels (Tub Lucite Acrylic + Glass Fiber)",
    ],
  },
  "jacuzzi-silver": {
    title: "Bath Tub – Jacuzzi Silver Model",
    amount: "60000",
    features: [
      "Jacuzzi Silver Model (Top Model Lucite Acrylic + Glass Fiber)",
      "Four Foot Jets (Steel Chrome S.S.)",
      "Front and Side Panels",
      "Jacuzzi Four Hydro jets with Pressure Regulator (1HP Pump)",
      "Pop Drain with Over Flow (Brass Chrome)",
      "Suction Unit",
      "Height Adjusted Legs",
      "Complete Stainless Steel Stand (Jindal304)",
      "Sleek Head rest Pillows (Black)",
    ],
  },
  "gold-model": {
    title: "Bath Tub – Gold Model",
    amount: "90000",
    features: [
      "Gold Model (Top Model Lucite Acrylic + Glass Fiber)",
      "Four Spine and Four Foot Jets (Steel Chrome S.S.)",
      "Front and Side Panels",
      "Six Hydro jets + Pressure Regulator (2HP Pump)",
      "Underwater Chromo Therapy Light (7 Colors)",
      "Pop Drain + Over Flow (Brass Chrome)",
      "Suction Unit",
      "Height Adjusted Legs",
      "Complete Stainless Steel Stand (Jindal304)",
      "Four Head rest Pillows (Black)",
      "Twelve Air Bubble Jets (0.5HP Air Motor)",
      "Total Jets – 26",
    ],
  },
};

const Invoice = () => {
  const invoiceRef = useRef();
  const [productImage, setProductImage] = useState("");
  const [customerName, setCustomerName] = useState("ABC Company");
  const [selectedProduct, setSelectedProduct] = useState("gold-model");
  const [productTitle, setProductTitle] = useState(productsData["gold-model"].title);
  const [bathtubSize, setBathtubSize] = useState("6 x 4 ft");
  const [price, setPrice] = useState(productsData["gold-model"].amount);
  const [features, setFeatures] = useState(productsData["gold-model"].features);
  const [newFeature, setNewFeature] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [gstRate] = useState(18);
  const [includeGST, setIncludeGST] = useState(true);

  useEffect(() => {
    const selected = productsData[selectedProduct];
    setProductTitle(selected.title);
    setPrice(selected.amount);
    setFeatures([...selected.features]);
  }, [selectedProduct]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) setProductImage(await toBase64(file));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const updateFeature = (i, value) => {
    const updated = [...features];
    updated[i] = value;
    setFeatures(updated);
  };

  const removeFeature = (i) => {
    const updated = [...features];
    updated.splice(i, 1);
    setFeatures(updated);
  };

  const baseAmount = parseInt(price) * parseInt(quantity);
  const gstAmount = includeGST ? Math.round(baseAmount * (gstRate / 100)) : 0;
  const totalAmount = baseAmount + gstAmount;

  const downloadAsImage = () => {
    const element = invoiceRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;

    const cloned = element.cloneNode(true);
    const serialized = new XMLSerializer().serializeToString(cloned);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <foreignObject width="100%" height="100%">
        ${serialized}
      </foreignObject>
    </svg>`;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${customerName || "invoice"}.png`;
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const printInvoice = () => {
    const element = invoiceRef.current;
    const printWindow = window.open("", "", "height=800,width=900");
    printWindow.document.write(element.innerHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const renderFeature = (f) => {
    const parts = f.split(/(\(.*?\))/g);
    return parts.map((part, idx) =>
      part.startsWith("(") && part.endsWith(")") ? (
        <span key={idx} className="font-bold">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col md:flex-row gap-6 justify-center">
      {/* Controls */}
      <div className="flex-1 max-w-md space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold mb-1 block text-sm">Upload Product Image:</label>
            <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 rounded w-full text-xs" />
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Invoice To:</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="border p-2 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Select Product:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            >
              {Object.entries(productsData).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Product Title:</label>
            <input
              type="text"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Size:</label>
            <input
              type="text"
              value={bathtubSize}
              onChange={(e) => setBathtubSize(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Quantity:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="border p-2 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="font-semibold mb-1 block text-sm">Price (₹):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 rounded w-full text-sm"
            />
          </div>
        </div>

        {/* GST Toggle */}
        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded">
          <input
            type="checkbox"
            id="gstToggle"
            checked={includeGST}
            onChange={(e) => setIncludeGST(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="gstToggle" className="font-semibold text-sm cursor-pointer">
            Include GST (18%)
          </label>
        </div>

        {/* Features */}
        <div>
          <label className="font-semibold mb-2 block text-sm">Features:</label>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold text-lg">★</span>
                <input
                  type="text"
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  className="border p-2 flex-grow rounded text-xs"
                />
                <button
                  onClick={() => removeFeature(i)}
                  className="bg-red-500 text-white px-2 rounded hover:bg-red-600 text-sm"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add new feature..."
              className="border p-2 flex-grow rounded text-sm"
            />
            <button onClick={addFeature} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 text-sm">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Preview + Download */}
      <div className="flex-1 flex flex-col items-center">
        <div ref={invoiceRef} className="bg-white w-full max-w-2xl shadow-xl border border-gray-300 text-xs">
          {/* Header */}
          <div className="flex items-center space-x-3 p-4 border-b bg-blue-50">
            <div className="w-16 h-16 bg-blue-200 rounded flex items-center justify-center font-bold text-blue-700 text-2xl">
              <img src="/logo.jpg"/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-700">Kazoma Industries Pvt. Ltd.</h1>
              <p className="text-xs text-gray-600">An ISO 9001:2015 Certified</p>
            </div>
          </div>

          {/* Invoice To */}
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="font-semibold">Invoice To: {customerName || "Customer Name"}</p>
          </div>

          {/* Product Info */}
          <div className="text-center border-b py-3 bg-blue-50">
            <h2 className="font-bold text-sm">
              {productTitle} – <span>{bathtubSize}</span>
            </h2>
          </div>

          {/* Features + Image */}
          <div className="px-4 py-4 relative min-h-96">
            <div className="flex gap-4">
              <div className="flex-1">
                <ul className="text-xs space-y-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500 font-bold">★</span>
                      <span>{renderFeature(f)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-48 text-center flex flex-col">
                {productImage ? (
                  <img
                    src={productImage}
                    alt="Product"
                    className="w-full h-40 object-cover border rounded mb-3"
                  />
                ) : (
                  <div className="w-full h-40 border flex items-center justify-center text-gray-400 text-xs rounded mb-3 bg-gray-50">
                    No Image
                  </div>
                )}

                <div className="border rounded p-3 bg-gray-50">
                  <p className="font-semibold border-b pb-1 mb-2">Price Calculation</p>
                  <div className="space-y-1 text-left text-xs">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-semibold">₹{price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-semibold">{quantity}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 mb-1">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{baseAmount.toLocaleString()}</span>
                    </div>
                    {includeGST && (
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span className="font-semibold">₹{gstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1 mt-2 font-bold text-green-700">
                      <span>Total Amount:</span>
                      <span className="text-lg">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Door Delivery Included</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="px-4 py-3 border-t border-b bg-gray-50 text-xs space-y-1">
            <p className="font-semibold text-gray-800 mb-2">Terms & Conditions:</p>
            <div className="grid grid-cols-2 gap-2">
              <p>• <strong>Delivery:</strong> Door Delivery Included</p>
              <p>• <strong>Warranty:</strong> 2 Yrs Motor, 10 Yrs Tub</p>
              <p>• <strong>Advance:</strong> 25% Advance Payment</p>
              <p>• <strong>Balance:</strong> After Courier Details</p>
              <p>• <strong>Completion:</strong> 7-10 Days</p>
              <p>• <strong>GST:</strong> 18% Extra {includeGST ? "(Included)" : "(Not Included)"}</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="px-4 py-3 border-b bg-gray-50 text-xs">
            <p className="font-semibold text-gray-800 mb-2">Bank Details for Payment:</p>
            <div className="space-y-1 font-mono text-xs">
              <p><strong>Bank Name:</strong> YES Bank</p>
              <p><strong>Account Number:</strong> 107863400001153</p>
              <p><strong>IFSC Code:</strong> YESB0001078</p>
              <p><strong>Account Holder:</strong> Kazoma Industries Pvt. Ltd.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-700 text-white text-xs py-3 px-4 space-y-2">
            <div className="flex justify-center space-x-4 flex-wrap gap-2">
              <p>📞 +91 8920929394</p>
              <p>📱 +91 97119 94994</p>
              <p>✉️ info@kazoma.com</p>
            </div>
            <p className="text-center">Khasra No.19/4, Kamruddin Nagar, Near Butterfly Sr. Sec. School, Nangloi Najafgarh Road, New Delhi 110041</p>
            <p className="text-center text-xs">Kazoma Administrator © 2024</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={printInvoice}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-semibold"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={downloadAsImage}
            className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-semibold"
          >
            ⬇️ Download as Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;