import express from "express";
import { protect } from "../middleware/protect.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = express.Router();
const auth = [protect, authorizeRoles("user", "vendor")];

router.get("/", ...auth, getMyAddresses);
router.post("/", ...auth, addAddress);
router.put("/:id", ...auth, updateAddress);
router.delete("/:id", ...auth, deleteAddress);

export default router;
