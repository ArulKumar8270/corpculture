import FrontHomeSettings from "../../models/frontHomeSettingsModel.js";
import { defaultFrontHomeSettings } from "../../utils/defaultFrontHomeSettings.js";

const getOrCreateSettings = async () => {
    let settings = await FrontHomeSettings.findOne();
    if (!settings) {
        settings = await FrontHomeSettings.create(defaultFrontHomeSettings);
    }
    return settings;
};

export const getFrontHomeSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.status(200).send({
            success: true,
            settings,
        });
    } catch (error) {
        console.error("Error fetching front home settings:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching front home settings",
            error,
        });
    }
};

export const updateFrontHomeSettings = async (req, res) => {
    try {
        const payload = req.body?.settings ?? req.body;
        if (!payload || typeof payload !== "object") {
            return res.status(400).send({
                success: false,
                message: "Settings payload is required",
            });
        }

        const settings = await FrontHomeSettings.findOneAndUpdate(
            {},
            { $set: payload },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).send({
            success: true,
            message: "Front home settings updated successfully",
            settings,
        });
    } catch (error) {
        console.error("Error updating front home settings:", error);
        res.status(500).send({
            success: false,
            message: "Error updating front home settings",
            error,
        });
    }
};

export const resetFrontHomeSettings = async (req, res) => {
    try {
        const settings = await FrontHomeSettings.findOneAndUpdate(
            {},
            { $set: defaultFrontHomeSettings },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).send({
            success: true,
            message: "Front home settings reset to defaults",
            settings,
        });
    } catch (error) {
        console.error("Error resetting front home settings:", error);
        res.status(500).send({
            success: false,
            message: "Error resetting front home settings",
            error,
        });
    }
};
