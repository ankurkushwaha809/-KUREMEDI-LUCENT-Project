import Address from "../model/Address.js";

export const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { label, shopName, address, city, state, pincode, phone, isDefault } =
      req.body;

    if (!address || !city || !pincode || !phone) {
      return res.status(400).json({
        message: "address, city, pincode and phone are required",
      });
    }

    const doc = await Address.create({
      user: req.user._id,
      label: label || "Home",
      shopName,
      address,
      city,
      state,
      pincode,
      phone,
      isDefault: !!isDefault,
    });

    res.status(201).json({ success: true, address: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const doc = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Address not found" });
    res.json({ success: true, address: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const doc = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!doc) return res.status(404).json({ message: "Address not found" });
    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
