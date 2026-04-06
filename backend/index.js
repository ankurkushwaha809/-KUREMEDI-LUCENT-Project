import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import connectDB from "./config/db.js";
import { attachSupportWs } from "./supportWs.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoriesRouter from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import addressRoutes from "./routes/address.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import configRoutes from "./routes/config.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import supportRoutes from "./routes/support.routes.js";
import marketingRoutes from "./routes/marketing.routes.js";

connectDB();

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
if (!fs.existsSync("uploads/categories"))
  fs.mkdirSync("uploads/categories", { recursive: true });
if (!fs.existsSync("uploads/products"))
  fs.mkdirSync("uploads/products", { recursive: true });
if (!fs.existsSync("uploads/brands"))
  fs.mkdirSync("uploads/brands", { recursive: true });
if (!fs.existsSync("uploads/kyc"))
  fs.mkdirSync("uploads/kyc", { recursive: true });
if (!fs.existsSync("uploads/agents"))
  fs.mkdirSync("uploads/agents", { recursive: true });
if (!fs.existsSync("uploads/banners"))
  fs.mkdirSync("uploads/banners", { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("CI/CD deployed successfully hehe 11🚀");
});
// app.get("/", (req, res) => {
//   res.send("Server is running  on port 5000🚀");
// });

// Product Routes
app.use("/api/products", productRoutes);
const uploadsDirFromWorkspace = path.resolve(process.cwd(), "uploads");
const uploadsDirFromBackend = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDirFromWorkspace));
if (uploadsDirFromBackend !== uploadsDirFromWorkspace) {
  app.use("/uploads", express.static(uploadsDirFromBackend));
}
app.use("/api/auth", authRoutes);

app.use("/api/categories", categoriesRouter);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/config", configRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/marketing", marketingRoutes);

// Error handler (e.g. multer LIMIT_FILE_SIZE) – must have 4 args
app.use((err, req, res, next) => {
  console.error("Request error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ message: "File too large. Max 5MB per file." });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "Unexpected file field" });
  }
  res.status(500).json({ message: err.message || "Server error" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const server = http.createServer(app);
attachSupportWs(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
