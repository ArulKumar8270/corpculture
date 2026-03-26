import express from "express";
import { registerController, getAllUsersController } from "../controllers/auth/registerController.js";
import { loginController } from "../controllers/auth/loginController.js";
import { userCheckController } from "../controllers/auth/userExist.js";
import { forgotPasswordController } from "../controllers/auth/forgotPassword.js";
import { updateDetailsController } from "../controllers/auth/updateDetails.js";
import { deactivateController } from "../controllers/auth/deactivateAccount.js";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import { deleteFileController, uploadFileController } from "../controllers/auth/uploadController.js";
//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

//LOGIN || METHOD POST
router.post("/login", loginController);

//USER EXIST || METHOD POST
router.post("/user-exist", userCheckController);

// FORGOT PASSWORD ROUTE
router.post("/forgot-password", forgotPasswordController);

//protected route-user
router.get("/user-auth", requireSignIn, (req, res) => {
    try {
        res.status(200).send({
            ok: true,
        });
    } catch (error) {
        console.log(error);
    }
});

// Admin dashboard access route:
// Allow Admin (role 1) and Employee (role 3) to open admin UI,
// but keep admin-only APIs protected by isAdmin elsewhere.
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

// update details POST route\
router.post("/update-details", updateDetailsController);

// deactivate account
router.post("/deactivate", deactivateController);

// Get all users route (example: protected for admin)
router.get('/all-users', isAdmin, getAllUsersController); // Add appropriate middleware

router.post(
    "/upload-file", // 'file' is the name of the field in your form data
    uploadFileController
);
router.post(
    "/delete-file/:fileName", // 'file' is the name of the field in your form data
    deleteFileController
);

export default router;
