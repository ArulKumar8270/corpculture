import Permission from "../models/permissionModel.js";

/**
 * Require a user permission key with a given action.
 * - Admin (role 1) always allowed.
 * - Others must have a Permission row where (userId, key) matches and actions contains action.
 */
export const requirePermission = (key, action = "view") => {
  return async (req, res, next) => {
    try {
      const role = Number(req.user?.role);
      if (role === 1) return next();

      if (!req.user?._id) {
        return res.status(401).send({
          success: false,
          message: "Unauthorised User",
        });
      }

      const perm = await Permission.findOne({
        userId: req.user._id,
        key,
      })
        .select("actions key")
        .lean();

      if (!perm || !Array.isArray(perm.actions) || !perm.actions.includes(action)) {
        return res.status(403).send({
          success: false,
          message: "Permission denied",
          key,
          action,
        });
      }

      return next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      return res.status(500).send({
        success: false,
        message: "Server error",
      });
    }
  };
};

