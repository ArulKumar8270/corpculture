import userModel from "../models/userModel.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send a push notification to all registered Expo tokens for a user.
 */
export async function sendPushToUser(userId, { title, body, data = {} }) {
    if (!userId || !title) return { sent: 0, skipped: true };

    const user = await userModel.findById(userId).select("expoPushTokens name");
    const tokens = (user?.expoPushTokens || []).filter(Boolean);

    if (!tokens.length) {
        return { sent: 0, skipped: true, reason: "no_tokens" };
    }

    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data,
        priority: "high",
        channelId: "assignments",
    }));

    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Expo push API error:", result);
            return { sent: 0, error: result };
        }

        const ticketData = Array.isArray(result?.data) ? result.data : [result?.data].filter(Boolean);
        const invalidTokens = [];

        ticketData.forEach((ticket, index) => {
            if (ticket?.status === "error" && ticket?.details?.error === "DeviceNotRegistered") {
                invalidTokens.push(tokens[index]);
            }
        });

        if (invalidTokens.length) {
            await userModel.findByIdAndUpdate(userId, {
                $pull: { expoPushTokens: { $in: invalidTokens } },
            });
        }

        return { sent: messages.length, tickets: ticketData };
    } catch (error) {
        console.error("Failed to send push notification:", error);
        return { sent: 0, error: error.message };
    }
}

function screenForAssignmentType(type) {
    switch (type) {
        case "service_enquiry":
            return "ServiceEnquiries";
        case "rental_enquiry":
            return "RentalEnquiries";
        case "sales_order":
            return "OrderList";
        case "service_report":
            return "ServiceReports";
        case "rental_report":
            return "RentalReports";
        case "service_gate_pass":
            return "ServiceGatePass";
        case "rental_gate_pass":
            return "RentalGatePass";
        case "service_delivery_challan":
            return "ServiceDeliveryChallan";
        case "rental_delivery_challan":
            return "RentalDeliveryChallan";
        case "service_returnable_challan":
            return "ServiceReturnableChallan";
        case "rental_returnable_challan":
            return "RentalReturnableChallan";
        default:
            return undefined;
    }
}

export async function notifyAssignment(userId, { type, title, body, entityId }) {
    const userIdStr = userId ? String(userId) : null;
    if (!userIdStr) return;

    return sendPushToUser(userIdStr, {
        title,
        body,
        data: {
            type,
            entityId: entityId ? String(entityId) : undefined,
            screen: screenForAssignmentType(type),
        },
    });
}
