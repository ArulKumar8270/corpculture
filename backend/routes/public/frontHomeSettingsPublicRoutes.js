import express from "express";
import { getFrontHomeSettings } from "../../controllers/frontHome/frontHomeSettingsController.js";

const router = express.Router();

router.get("/", getFrontHomeSettings);

export default router;
