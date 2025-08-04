import RentalPaymentEntry from "../models/rentalPaymentEntryModel.js";
import Machine from "../models/machineModel.js";
import cloudinary from "cloudinary";

// Create a new rental payment entry
export const createRentalPaymentEntry = async (req, res) => {
    try {
        const {
            machineId,
            sendDetailsTo,
            remarks,
            a4BwOldCount,
            a4BwNewCount,
        } = req.body;

        const countImageUpload = req.files?.countImageUpload; // Assuming file upload via express-fileupload or similar

        // Basic Validation
        if (!machineId || !sendDetailsTo || a4BwOldCount === undefined || a4BwNewCount === undefined) {
            return res.status(400).send({ success: false, message: 'Missing required fields.' });
        }

        // Validate Machine and get companyId
        const machine = await Machine.findById(machineId).populate('companyId');
        if (!machine) {
            return res.status(404).send({ success: false, message: 'Machine not found.' });
        }

        // Upload image to Cloudinary if provided
        let countImageUploadUrl = '';
        if (countImageUpload) {
            const result = await cloudinary.v2.uploader.upload(countImageUpload.tempFilePath, {
                folder: "rental_payment_entries",
            });
            countImageUploadUrl = result.secure_url;
        }

        const newEntry = new RentalPaymentEntry({
            machineId,
            companyId: machine.companyId._id, // Get companyId from the machine
            sendDetailsTo,
            countImageUpload: countImageUploadUrl,
            remarks,
            a4BwOldCount,
            a4BwNewCount,
        });

        await newEntry.save();

        // Optionally, update the machine's currentCount to the new count
        machine.currentCount = a4BwNewCount;
        await machine.save();

        res.status(201).send({ success: true, message: 'Rental Payment Entry created successfully', entry: newEntry });

    } catch (error) {
        console.error("Error in createRentalPaymentEntry:", error);
        res.status(500).send({ success: false, message: 'Error in creating rental payment entry', error });
    }
};

// Get all serial numbers (machines) for dropdown
export const getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.find({}).select('serialNumber companyId currentCount').populate('companyId', 'companyName');
        res.status(200).send({ success: true, machines });
    } catch (error) {
        console.error("Error in getAllMachines:", error);
        res.status(500).send({ success: false, message: 'Error fetching machines', error });
    }
};

// Get machine details by serial number (or machine ID)
export const getMachineDetails = async (req, res) => {
    try {
        const { machineId } = req.params; // Assuming machineId is passed
        const machine = await Machine.findById(machineId).populate('companyId', 'companyName');
        if (!machine) {
            return res.status(404).send({ success: false, message: 'Machine not found.' });
        }
        res.status(200).send({ success: true, machine });
    } catch (error) {
        console.error("Error in getMachineDetails:", error);
        res.status(500).send({ success: false, message: 'Error fetching machine details', error });
    }
};

// You might also need a way to get "Send Details To" options.
// For now, I'll assume a hardcoded list or fetch from a separate model if it exists.
export const getSendDetailsToOptions = async (req, res) => {
    try {
        // In a real application, these might come from a database or configuration
        const options = ["Email", "WhatsApp", "Physical Copy", "Other"];
        res.status(200).send({ success: true, options });
    } catch (error) {
        console.error("Error in getSendDetailsToOptions:", error);
        res.status(500).send({ success: false, message: 'Error fetching send details options', error });
    }
};