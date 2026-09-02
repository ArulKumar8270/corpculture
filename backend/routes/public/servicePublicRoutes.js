import express from "express";
import {
    createService,
    getServiceByPhone,
    getServiceByType,
    getServiceAssignedTo,
} from "../../controllers/service/serviceController.js";

const router = express.Router();

router.post("/create", createService);
router.get("/serviceType/:serviceType", getServiceByType);
router.get("/phone/:phone", getServiceByPhone);
router.get("/assignedTo/:assignedTo", getServiceAssignedTo);

export default router;
