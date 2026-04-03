/**
 * Authorize by user role. User schema roles: "user" | "vendor" | "admin"
 * Pass allowed roles: e.g. authorizeRoles("user", "vendor") for retailers
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

/**
 * Require user KYC to be APPROVED. Use for cart, orders, etc.
 */
export const requireKycApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (req.user.kyc !== "APPROVED") {
    return res.status(403).json({
      success: false,
      message: "Your account must be KYC approved to use cart. Please complete verification.",
    });
  }
  next();
};
