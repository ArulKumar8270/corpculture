import express from "express";
import { registerController } from "../../controllers/auth/registerController.js";
import { loginController } from "../../controllers/auth/loginController.js";
import { userCheckController } from "../../controllers/auth/userExist.js";
import { forgotPasswordController } from "../../controllers/auth/forgotPassword.js";
import { updateDetailsController } from "../../controllers/auth/updateDetails.js";
import { deactivateController } from "../../controllers/auth/deactivateAccount.js";
import { deleteFileController, uploadFileController } from "../../controllers/auth/uploadController.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/user-exist", userCheckController);
router.post("/forgot-password", forgotPasswordController);
router.post("/update-details", updateDetailsController);
router.post("/deactivate", deactivateController);
router.post("/upload-file", uploadFileController);
router.post("/delete-file/:fileName", deleteFileController);

export default router;
