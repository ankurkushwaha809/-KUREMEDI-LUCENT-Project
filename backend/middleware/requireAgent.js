/**
 * Use after protect(). Rejects if the authenticated user is not an agent.
 * Used for MR app routes so only agents can access.
 */
export const requireAgent = (req, res, next) => {
  if (req.user?.role !== "agent") {
    return res.status(403).json({
      message: "This app is for agents only. Your account is not registered as an agent.",
    });
  }
  next();
};
