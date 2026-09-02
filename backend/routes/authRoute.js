import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import authPublicRoutes from "./public/authPublicRoutes.js";
import { deactivateUserByAdminController } from "../controllers/auth/deactivateAccount.js";
import { getAllUsersController } from "../controllers/auth/registerController.js";

const router = express.Router();

router.use(authPublicRoutes);

router.get("/user-auth", requireSignIn, (req, res) => {
    res.status(200).send({ ok: true });
});

router.get("/admin-auth", requireSignIn, (req, res) => {
    const role = Number(req.user?.role);
    if (role === 1 || role === 3) {
        return res.status(200).send({ ok: true, role });
    }
    return res.status(403).send({
        ok: false,
        message: "Access denied. Admin/Employee privileges required.",
    });
});

router.post("/deactivate-user", isAdmin, deactivateUserByAdminController);
router.get("/all-users", isAdmin, getAllUsersController);

export default router;
