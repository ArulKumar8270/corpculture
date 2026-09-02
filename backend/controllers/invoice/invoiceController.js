import Invoice from "../../models/invoiceModel.js";
import { softDeleteById, restoreById, getTrashListQuery, mapWithRecordStatus, TRASH_SUCCESS_MESSAGE, RESTORE_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

// Create new invoice
export const createInvoice = async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
        await invoice.save();
        
        res.status(201).send({
            success: true,
            message: "Invoice created successfully",
            invoice
        });
    } catch (error) {
        console.error("Error in invoice creation:", error);
        res.status(500).send({
            success: false,
            message: "Error in invoice creation",
            error
        });
    }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
    try {
        const { filter, options } = getTrashListQuery(req);
        const invoices = await Invoice.find(filter)
            .setOptions(options)
            .populate('customer')
            .populate('order')
            .sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            invoices: mapWithRecordStatus(invoices)
        });
    } catch (error) {
        console.error("Error in fetching invoices:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting invoices",
            error
        });
    }
};

// Get single invoice
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer')
            .populate('order');

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            invoice
        });
    } catch (error) {
        console.error("Error in fetching invoice:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting invoice",
            error
        });
    }
};

// Update invoice
export const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        console.error("Error in updating invoice:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating invoice",
            error
        });
    }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await softDeleteById(Invoice, req.params.id, req.user?._id);

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE
        });
    } catch (error) {
        console.error("Error in deleting invoice:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting invoice",
            error
        });
    }
};

// Restore invoice from trash
export const restoreInvoice = async (req, res) => {
    try {
        const restoredInvoice = await restoreById(Invoice, req.params.id);

        if (!restoredInvoice) {
            return res.status(404).send({
                success: false,
                message: "Invoice not found in trash."
            });
        }

        res.status(200).send({
            success: true,
            message: RESTORE_SUCCESS_MESSAGE,
            invoice: mapWithRecordStatus([restoredInvoice])[0],
        });
    } catch (error) {
        console.error("Error in restoring invoice:", error);
        res.status(500).send({
            success: false,
            message: "Error in restoring invoice",
            error
        });
    }
};