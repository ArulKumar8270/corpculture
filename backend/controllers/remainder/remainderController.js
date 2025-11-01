import Remainder from "../../models/remainderModel.js";
import Company from "../../models/companyModel.js"; // Assuming you have a Company model
import ServiceInvoice from "../../models/serviceInvoiceModel.js"; // Import ServiceInvoice model
import RentalPaymentEntry from "../../models/rentalPaymentEntryModel.js"; // Import RentalPaymentEntry model

// Create a new remainder
export const createRemainder = async (req, res) => {
    try {
        const { companyId, remainderType, remainderMail, ccMails, remainderDates } = req.body;

        // Basic Validation
        if (!companyId || !remainderType || !remainderMail || !remainderDates || remainderDates.length === 0) {
            return res.status(400).send({ success: false, message: 'Missing required fields: companyId, remainderType, remainderMail, remainderDates.' });
        }

        // Validate Company ID
        const existingCompany = await Company.findById(companyId);
        if (!existingCompany) {
            return res.status(404).send({ success: false, message: 'Company not found.' });
        }

        // Validate email formats (already handled by schema, but good to have a check here too)
        if (!/^\S+@\S+\.\S+$/.test(remainderMail)) {
            return res.status(400).send({ success: false, message: 'Invalid remainderMail format.' });
        }
        if (ccMails && !Array.isArray(ccMails)) {
            return res.status(400).send({ success: false, message: 'ccMails must be an array.' });
        }
        if (ccMails) {
            for (const email of ccMails) {
                if (!/^\S+@\S+\.\S+$/.test(email)) {
                    return res.status(400).send({ success: false, message: `Invalid CC email format: ${email}.` });
                }
            }
        }

        const newRemainder = new Remainder({
            companyId,
            remainderType,
            remainderMail,
            ccMails: ccMails || [],
            remainderDates,
        });

        await newRemainder.save();

        res.status(201).send({ success: true, message: 'Remainder created successfully', remainder: newRemainder });

    } catch (error) {
        console.error("Error in createRemainder:", error);
        res.status(500).send({ success: false, message: 'Error in creating remainder', error });
    }
};

// Get all remainders
export const getAllRemainders = async (req, res) => {
    try {
        const remainders = await Remainder.find({})
            .populate('companyId') // Populate company details
            .sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            message: 'All remainders fetched successfully',
            remainders
        });
    } catch (error) {
        console.error("Error in getAllRemainders:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching all remainders',
            error
        });
    }
};

// Get single remainder by ID
export const getRemainderById = async (req, res) => {
    try {
        const { id } = req.params;
        const remainder = await Remainder.findById(id)
            .populate('companyId');

        if (!remainder) {
            return res.status(404).send({
                success: false,
                message: 'Remainder not found'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Remainder fetched successfully',
            remainder
        });
    } catch (error) {
        console.error("Error in getRemainderById:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching remainder by ID',
            error
        });
    }
};

// Get remainders by Company ID
export const getRemaindersByCompany = async (req, res) => {
    try {
        const { companyId, type } = req.params;

        if (!companyId) {
            return res.status(400).send({ success: false, message: 'Company ID is required.' });
        }

        const remainders = await Remainder.findOne({ companyId, remainderType: type })
            .populate('companyId')
            .sort({ createdAt: -1 });

        if (!remainders || remainders.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No remainders found for this company.'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Remainders fetched successfully for the company',
            remainders
        });
    } catch (error) {
        console.error("Error in getRemaindersByCompany:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching remainders by company',
            error
        });
    }
};

// Update a remainder
export const updateRemainder = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, remainderType, remainderMail, ccMails, remainderDates } = req.body;

        let remainder = await Remainder.findById(id);

        if (!remainder) {
            return res.status(404).send({ success: false, message: 'Remainder not found.' });
        }

        // Validate Company ID if provided
        if (companyId) {
            const existingCompany = await Company.findById(companyId);
            if (!existingCompany) {
                return res.status(404).send({ success: false, message: 'Company not found.' });
            }
        }

        // Validate email formats if provided
        if (remainderMail && !/^\S+@\S+\.\S+$/.test(remainderMail)) {
            return res.status(400).send({ success: false, message: 'Invalid remainderMail format.' });
        }
        if (ccMails && !Array.isArray(ccMails)) {
            return res.status(400).send({ success: false, message: 'ccMails must be an array.' });
        }
        if (ccMails) {
            for (const email of ccMails) {
                if (!/^\S+@\S+\.\S+$/.test(email)) {
                    return res.status(400).send({ success: false, message: `Invalid CC email format: ${email}.` });
                }
            }
        }

        // Update fields
        remainder.companyId = companyId || remainder.companyId;
        remainder.remainderType = remainderType || remainder.remainderType;
        remainder.remainderMail = remainderMail || remainder.remainderMail;
        remainder.ccMails = ccMails !== undefined ? ccMails : remainder.ccMails; // Allow clearing ccMails
        remainder.remainderDates = remainderDates !== undefined ? remainderDates : remainder.remainderDates; // Allow clearing remainderDates

        await remainder.save();

        const updatedRemainder = await Remainder.findById(remainder._id).populate('companyId');

        res.status(200).send({ success: true, message: 'Remainder updated successfully', remainder: updatedRemainder });

    } catch (error) {
        console.error("Error in updateRemainder:", error);
        res.status(500).send({ success: false, message: 'Error in updating remainder', error });
    }
};

// Delete a remainder
export const deleteRemainder = async (req, res) => {
    try {
        const { id } = req.params;
        const remainder = await Remainder.findByIdAndDelete(id);

        if (!remainder) {
            return res.status(404).send({ success: false, message: 'Remainder not found.' });
        }

        res.status(200).send({ success: true, message: 'Remainder deleted successfully' });

    } catch (error) {
        console.error("Error in deleteRemainder:", error);
        res.status(500).send({ success: false, message: 'Error in deleting remainder', error });
    }
};

// Get remainders by today's date
export const getRemaindersByTodayDate = async (req, res) => {
    try {
        const today = new Date();
        const { remainderType } = req.query;

        // Today's date as a number (day of the month)
        const todayDayOfMonth = today.getDate();

        const query = {
            remainderDates: { $in: [todayDayOfMonth] }
        };

        if (remainderType) {
            query.remainderType = remainderType;
        }

        // Find remainders where today's date is inside remainderDates array
        const remainders = await Remainder.find(query)
            .populate('companyId', '_id')
            .sort({ createdAt: -1 });

        if (!remainders || remainders.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No remainders found for today.'
            });
        }

        // Attach unpaid invoices for each remainder’s company
        const remaindersWithInvoices = await Promise.all(
            remainders.map(async (remainder) => {
                const companyObjectId = remainder.companyId._id;

                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                const endOfDay = new Date(today.setHours(23, 59, 59, 999));

                const unpaidServiceInvoices = await ServiceInvoice.find({
                    companyId: companyObjectId,
                    status: "Unpaid",
                    invoiceType: "invoice",
                    invoiceDate: { $gte: startOfDay, $lte: endOfDay }
                }, { _id: 1 });

                const unpaidRentalInvoices = await RentalPaymentEntry.find({
                    companyId: companyObjectId,
                    status: "Unpaid",
                    invoiceType: "invoice",
                    invoiceDate: { $gte: startOfDay, $lte: endOfDay }
                }, { _id: 1 });

                return {
                    ...remainder.toObject(),
                    unpaidServiceInvoices,
                    unpaidRentalInvoices
                };
            })
        );

        res.status(200).send({
            success: true,
            message: 'Remainders for today fetched successfully with associated unpaid invoices',
            remainders: remaindersWithInvoices
        });
    } catch (error) {
        console.error("Error in getRemaindersByTodayDate:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching remainders for today',
            error: error.message
        });
    }
};
