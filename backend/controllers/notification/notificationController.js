import userModel from "../../models/userModel.js";

export const registerPushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user?._id;

        if (!pushToken || typeof pushToken !== "string") {
            return res.status(400).send({
                success: false,
                message: "pushToken is required",
            });
        }

        const token = pushToken.trim();
        if (!token.startsWith("ExponentPushToken") && !token.startsWith("ExpoPushToken")) {
            return res.status(400).send({
                success: false,
                message: "Invalid Expo push token",
            });
        }

        await userModel.findByIdAndUpdate(userId, {
            $addToSet: { expoPushTokens: token },
        });

        res.status(200).send({
            success: true,
            message: "Push token registered",
        });
    } catch (error) {
        console.error("Error registering push token:", error);
        res.status(500).send({
            success: false,
            message: "Error registering push token",
            error: error.message,
        });
    }
};

export const removePushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user?._id;

        if (!pushToken) {
            return res.status(400).send({
                success: false,
                message: "pushToken is required",
            });
        }

        await userModel.findByIdAndUpdate(userId, {
            $pull: { expoPushTokens: pushToken.trim() },
        });

        res.status(200).send({
            success: true,
            message: "Push token removed",
        });
    } catch (error) {
        console.error("Error removing push token:", error);
        res.status(500).send({
            success: false,
            message: "Error removing push token",
            error: error.message,
        });
    }
};
