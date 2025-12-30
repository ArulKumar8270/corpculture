import Purchase from "../../models/purchaseModel.js";
import Vendor from "../../models/vendorModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

// Create Purchase
export const createPurchase = async (req, res) => {
    try {
        const {
            vendorCompanyName, productName, voucherType, purchaseInvoiceNumber, narration, purchaseDate, quantity, rate, freightCharges, price, grossTotal, roundOff
        } = req.body;

        // Validation
        if (!vendorCompanyName || !productName || !voucherType || !purchaseInvoiceNumber ||
            !purchaseDate || quantity === undefined || rate === undefined || price === undefined || grossTotal === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided.' });
        }

        if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
            return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        }
        if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
            return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        }
        if (freightCharges !== undefined && (isNaN(parseFloat(freightCharges)) || parseFloat(freightCharges) < 0)) {
            return res.status(400).send({ success: false, message: 'Freight Charges must be a non-negative number.' });
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).send({ success: false, message: 'Price must be a non-negative number.' });
        }
        if (isNaN(parseFloat(grossTotal)) || parseFloat(grossTotal) < 0) {
            return res.status(400).send({ success: false, message: 'Gross Total must be a non-negative number.' });
        }
        if (roundOff !== undefined && isNaN(parseFloat(roundOff))) {
            return res.status(400).send({ success: false, message: 'Round Off must be a number.' });
        }

        // Check if vendor exists
        const existingVendor = await Vendor.findById(vendorCompanyName);
        if (!existingVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found.' });
        }

        // Check if purchase invoice number already exists
        const existingPurchase = await Purchase.findOne({ purchaseInvoiceNumber });
        if (existingPurchase) {
            return res.status(409).send({ success: false, message: 'Purchase with this invoice number already exists.' });
        }

        const newPurchase = new Purchase({
            vendorCompanyName,
            productName,
            voucherType,
            purchaseInvoiceNumber,
            narration,
            purchaseDate: new Date(purchaseDate),
            quantity: parseFloat(quantity),
            rate: parseFloat(rate),
            freightCharges: freightCharges !== undefined ? parseFloat(freightCharges) : 0,
            price: parseFloat(price),
            grossTotal: parseFloat(grossTotal),
            roundOff: roundOff !== undefined ? parseFloat(roundOff) : 0,
        });

        await newPurchase.save();
        res.status(201).send({ success: true, message: 'Purchase created successfully', purchase: newPurchase });
    } catch (error) {
        console.error("Error in createPurchase:", error);
        res.status(500).send({ success: false, message: 'Error in creating purchase', error });
    }
};

// Bulk Create Purchases
export const bulkCreatePurchases = async (req, res) => {
    try {
        let purchases = [];

        // Debug: Log request details
        console.log('Request files:', req.files);
        console.log('Request body keys:', Object.keys(req.body || {}));

        // Check if file was uploaded - try multiple possible field names
        let file = null;
        if (req.files) {
            // Try common field names
            file = req.files.file || req.files.json || req.files.data || req.files.upload || 
                   req.files.purchases || Object.values(req.files)[0];
        }

        if (file) {
            console.log('File found:', file.name, 'MIME type:', file.mimetype);
            
            // Check if it's a JSON file (by extension or MIME type)
            const isJsonFile = file.name.endsWith('.json') || 
                              file.mimetype === 'application/json' ||
                              file.mimetype === 'text/json' ||
                              file.mimetype === 'application/octet-stream';
            
            if (!isJsonFile) {
                return res.status(400).send({
                    success: false,
                    message: 'Only JSON files are allowed.',
                    received: {
                        filename: file.name,
                        mimetype: file.mimetype
                    }
                });
            }

            // Read file content
            const fileContent = file.data.toString('utf8');
            console.log('File content length:', fileContent.length, 'characters');
            
            // Check if it's newline-delimited JSON (NDJSON) by checking if first line is valid JSON
            const lines = fileContent.split('\n').filter(line => line.trim());
            const isNDJSON = lines.length > 1 && lines.every(line => {
                try {
                    JSON.parse(line);
                    return true;
                } catch {
                    return false;
                }
            });
            
            if (isNDJSON) {
                // Parse as newline-delimited JSON
                purchases = lines.map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.error('Error parsing line:', line, e);
                        return null;
                    }
                }).filter(item => item !== null);
            } else {
                // Try to parse as single JSON (array or object)
                try {
                    const parsed = JSON.parse(fileContent);
                    
                    // If it's already an array, use it
                    if (Array.isArray(parsed)) {
                        purchases = parsed;
                    } 
                    // If it's a single object, wrap it in an array
                    else if (typeof parsed === 'object' && parsed !== null) {
                        purchases = [parsed];
                    }
                    else {
                        return res.status(400).send({
                            success: false,
                            message: 'Invalid JSON format. Expected an array or object(s).'
                        });
                    }
                } catch (parseError) {
                    return res.status(400).send({
                        success: false,
                        message: 'Invalid JSON file format. Please ensure the file contains valid JSON.',
                        error: parseError.message
                    });
                }
            }
            
            if (purchases.length === 0) {
                return res.status(400).send({
                    success: false,
                    message: 'No valid purchase data found in the file.'
                });
            }
        } 
        // If no file, check if purchases array is in request body
        else if (req.body.purchases) {
            purchases = req.body.purchases;
        } 
        // If purchases is directly in body as array
        else if (Array.isArray(req.body)) {
            purchases = req.body;
        }
        // Check if JSON data is in body as string (base64 or direct)
        else if (req.body.data || req.body.json) {
            try {
                const jsonData = req.body.data || req.body.json;
                let fileContent = '';
                
                // Try to decode if it's base64
                if (typeof jsonData === 'string') {
                    try {
                        fileContent = Buffer.from(jsonData, 'base64').toString('utf8');
                    } catch {
                        // If not base64, use as-is
                        fileContent = jsonData;
                    }
                } else {
                    fileContent = JSON.stringify(jsonData);
                }
                
                // Parse the content
                const lines = fileContent.split('\n').filter(line => line.trim());
                const isNDJSON = lines.length > 1 && lines.every(line => {
                    try {
                        JSON.parse(line);
                        return true;
                    } catch {
                        return false;
                    }
                });
                
                if (isNDJSON) {
                    purchases = lines.map(line => {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            return null;
                        }
                    }).filter(item => item !== null);
                } else {
                    const parsed = JSON.parse(fileContent);
                    purchases = Array.isArray(parsed) ? parsed : [parsed];
                }
            } catch (error) {
                return res.status(400).send({
                    success: false,
                    message: 'Error parsing JSON data from request body.',
                    error: error.message
                });
            }
        }
        else {
            return res.status(400).send({
                success: false,
                message: 'Please upload a JSON file or provide purchases array in request body.',
                debug: {
                    hasFiles: !!req.files,
                    fileKeys: req.files ? Object.keys(req.files) : [],
                    bodyKeys: Object.keys(req.body || {}),
                    bodyType: typeof req.body
                }
            });
        }

        console.log(`Processing ${purchases.length} purchases from ${req.files ? 'file upload' : 'request body'}`);

        // Validate that purchases is an array
        if (!Array.isArray(purchases) || purchases.length === 0) {
            return res.status(400).send({ 
                success: false, 
                message: 'Purchases must be a non-empty array.' 
            });
        }

        // Limit the number of purchases that can be uploaded at once
        if (purchases.length > 1000) {
            return res.status(400).send({ 
                success: false, 
                message: 'Maximum 1000 purchases can be uploaded at once.' 
            });
        }

        const results = {
            successful: [],
            failed: [],
            total: purchases.length,
            successCount: 0,
            failureCount: 0
        };

        // Get all existing invoice numbers to check for duplicates
        const existingInvoiceNumbers = new Set();
        const existingPurchases = await Purchase.find({}, { purchaseInvoiceNumber: 1 });
        existingPurchases.forEach(p => existingInvoiceNumbers.add(p.purchaseInvoiceNumber));

        // Track invoice numbers in the current batch to detect duplicates within the batch
        const batchInvoiceNumbers = new Set();

        // Validate and process each purchase
        for (let i = 0; i < purchases.length; i++) {
            const purchaseData = purchases[i];
            const rowNumber = i + 1;
            let errorMessages = [];

            try {
                // Handle MongoDB ObjectId format ($oid) from JSON export
                const extractObjectId = (value) => {
                    if (!value) return null;
                    if (typeof value === 'string') return value;
                    if (value.$oid) return value.$oid;
                    if (value._id) return extractObjectId(value._id);
                    return value.toString();
                };

                // Map fields from vendor products JSON format
                // vendorCompanyName from JSON -> vendorCompanyName in purchase
                // _id from JSON -> productName in purchase
                // pricePerQuantity from JSON -> rate in purchase
                const vendorCompanyName = extractObjectId(purchaseData.vendorCompanyName);
                const productId = extractObjectId(purchaseData._id) || extractObjectId(purchaseData.productName);
                const pricePerQuantity = purchaseData.pricePerQuantity || purchaseData.rate;
                
                // Use provided values or defaults
                const voucherType = purchaseData.voucherType || 'Purchase';
                const purchaseInvoiceNumber = purchaseData.purchaseInvoiceNumber || `BULK-${Date.now()}-${i + 1}`;
                const narration = purchaseData.narration || '';
                const purchaseDate = purchaseData.purchaseDate || new Date();
                const quantity = purchaseData.quantity !== undefined && purchaseData.quantity !== null ? purchaseData.quantity : 1;
                const rate = pricePerQuantity !== undefined && pricePerQuantity !== null ? pricePerQuantity : (purchaseData.rate || 0);
                const freightCharges = purchaseData.freightCharges !== undefined && purchaseData.freightCharges !== null ? purchaseData.freightCharges : 0;
                const roundOff = purchaseData.roundOff !== undefined && purchaseData.roundOff !== null ? purchaseData.roundOff : 0;
                
                // Calculate price and grossTotal if not provided
                const calculatedPrice = purchaseData.price !== undefined && purchaseData.price !== null 
                    ? purchaseData.price 
                    : (parseFloat(quantity) * parseFloat(rate));
                const grossTotal = purchaseData.grossTotal !== undefined && purchaseData.grossTotal !== null 
                    ? purchaseData.grossTotal 
                    : calculatedPrice; // Default to price if not provided

                // Required field validation
                if (!vendorCompanyName) errorMessages.push('Vendor Company Name is required');
                if (!productId) errorMessages.push('Product ID (_id) is required');

                // Check for duplicate invoice number in batch
                if (purchaseInvoiceNumber && batchInvoiceNumbers.has(purchaseInvoiceNumber)) {
                    errorMessages.push(`Duplicate invoice number in upload: ${purchaseInvoiceNumber}`);
                }

                // Check for duplicate invoice number in database
                if (purchaseInvoiceNumber && existingInvoiceNumbers.has(purchaseInvoiceNumber)) {
                    errorMessages.push(`Invoice number already exists: ${purchaseInvoiceNumber}`);
                }

                // Numeric validation
                if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
                    errorMessages.push('Quantity must be a non-negative number');
                }
                if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
                    errorMessages.push('Rate must be a non-negative number');
                }
                if (freightCharges !== undefined && freightCharges !== null && (isNaN(parseFloat(freightCharges)) || parseFloat(freightCharges) < 0)) {
                    errorMessages.push('Freight Charges must be a non-negative number');
                }
                if (isNaN(parseFloat(calculatedPrice)) || parseFloat(calculatedPrice) < 0) {
                    errorMessages.push('Price must be a non-negative number');
                }
                if (isNaN(parseFloat(grossTotal)) || parseFloat(grossTotal) < 0) {
                    errorMessages.push('Gross Total must be a non-negative number');
                }
                if (roundOff !== undefined && roundOff !== null && isNaN(parseFloat(roundOff))) {
                    errorMessages.push('Round Off must be a number');
                }

                // If there are validation errors, skip this purchase
                if (errorMessages.length > 0) {
                    results.failed.push({
                        row: rowNumber,
                        purchaseInvoiceNumber: purchaseInvoiceNumber || 'N/A',
                        productId: productId || 'N/A',
                        errors: errorMessages,
                        data: purchaseData
                    });
                    results.failureCount++;
                    continue;
                }

                // Check if vendor exists
                const existingVendor = await Vendor.findById(vendorCompanyName);
                if (!existingVendor) {
                    results.failed.push({
                        row: rowNumber,
                        purchaseInvoiceNumber: purchaseInvoiceNumber,
                        productId: productId || 'N/A',
                        errors: ['Vendor not found'],
                        data: purchaseData
                    });
                    results.failureCount++;
                    continue;
                }

                // Check if product exists (optional validation - you may want to verify the product ID exists)
                // This is commented out as it might not be necessary if you trust the data
                // const existingProduct = await VendorProduct.findById(productId);
                // if (!existingProduct) {
                //     results.failed.push({
                //         row: rowNumber,
                //         purchaseInvoiceNumber: purchaseInvoiceNumber,
                //         productId: productId,
                //         errors: ['Product not found'],
                //         data: purchaseData
                //     });
                //     results.failureCount++;
                //     continue;
                // }

                // Add invoice number to batch set
                batchInvoiceNumbers.add(purchaseInvoiceNumber);

                // Create purchase object
                const newPurchase = new Purchase({
                    vendorCompanyName,
                    productName: productId, // Use the _id from JSON as productName
                    voucherType,
                    purchaseInvoiceNumber,
                    narration: narration || '',
                    purchaseDate: purchaseDate instanceof Date ? purchaseDate : new Date(purchaseDate),
                    quantity: parseFloat(quantity),
                    rate: parseFloat(rate),
                    freightCharges: parseFloat(freightCharges),
                    price: parseFloat(calculatedPrice),
                    grossTotal: parseFloat(grossTotal),
                    roundOff: parseFloat(roundOff),
                });

                // Save purchase
                const savedPurchase = await newPurchase.save();
                
                // Add to existing invoice numbers set to prevent duplicates in same batch
                existingInvoiceNumbers.add(purchaseInvoiceNumber);

                results.successful.push({
                    row: rowNumber,
                    purchaseInvoiceNumber: purchaseInvoiceNumber,
                    productId: productId,
                    purchaseId: savedPurchase._id
                });
                results.successCount++;

            } catch (error) {
                console.error(`Error processing purchase at row ${rowNumber}:`, error);
                const productId = purchaseData?._id?.$oid || purchaseData?._id || purchaseData?.productName?.$oid || purchaseData?.productName || 'N/A';
                results.failed.push({
                    row: rowNumber,
                    purchaseInvoiceNumber: purchaseData?.purchaseInvoiceNumber || 'N/A',
                    productId: productId,
                    errors: [error.message || 'Unknown error occurred'],
                    data: purchaseData
                });
                results.failureCount++;
            }
        }

        // Prepare response
        const response = {
            success: results.successCount > 0,
            message: `Bulk upload completed. ${results.successCount} successful, ${results.failureCount} failed out of ${results.total} total.`,
            results: {
                total: results.total,
                successCount: results.successCount,
                failureCount: results.failureCount,
                successful: results.successful,
                failed: results.failed
            }
        };

        // Return appropriate status code
        if (results.failureCount === 0) {
            res.status(201).send(response);
        } else if (results.successCount === 0) {
            res.status(400).send(response);
        } else {
            res.status(207).send(response); // 207 Multi-Status for partial success
        }

    } catch (error) {
        console.error("Error in bulkCreatePurchases:", error);
        res.status(500).send({ 
            success: false, 
            message: 'Error in bulk creating purchases', 
            error: error.message 
        });
    }
};

// Get All Purchases
export const getAllPurchases = async (req, res) => {
    try {
        const { category } = req.query; // Get category from query parameters
        let filter = {};

        if (category) {
            filter.category = category; // Add category to filter if provided
        }

        const purchases = await Purchase.find(filter) // Apply the filter
            .populate('vendorCompanyName', 'companyName') // Populate vendor company name
            .populate('productName') // Populate product details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Purchases fetched', purchases });
    } catch (error) {
        console.error("Error in getAllPurchases:", error);
        res.status(500).send({ success: false, message: 'Error in getting all purchases', error });
    }
};

// Get Single Purchase by ID
export const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id)
            .populate('vendorCompanyName')
            .populate('productName') // Populate product details
            .populate({
                path: "productName",
                populate: [
                    {
                        path: "gstType", // populate gstType inside productId
                    }
                ]
            })
        if (!purchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found' });
        }
        res.status(200).send({ success: true, message: 'Purchase fetched successfully', purchase });
    } catch (error) {
        console.error("Error in getPurchaseById:", error);
        res.status(500).send({ success: false, message: 'Error in getting purchase', error });
    }
};

// Update Purchase
export const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendorCompanyName, productName, voucherType, purchaseInvoiceNumber, narration, purchaseDate, quantity, rate, freightCharges, price, grossTotal, roundOff
        } = req.body;

        // Basic Validation for update
        // if (!productName) {
        //     return res.status(400).send({ success: false, message: 'All required fields must be provided for update.' });
        // }

        // if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
        //     return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
        //     return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        // }
        // if (freightCharges !== undefined && (isNaN(parseFloat(freightCharges)) || parseFloat(freightCharges) < 0)) {
        //     return res.status(400).send({ success: false, message: 'Freight Charges must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        //     return res.status(400).send({ success: false, message: 'Price must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(grossTotal)) || parseFloat(grossTotal) < 0) {
        //     return res.status(400).send({ success: false, message: 'Gross Total must be a non-negative number.' });
        // }
        // if (roundOff !== undefined && isNaN(parseFloat(roundOff))) {
        //     return res.status(400).send({ success: false, message: 'Round Off must be a number.' });
        // }

        // Check if vendor exists
        if (vendorCompanyName) {
            const existingVendor = await Vendor.findById(vendorCompanyName);
            if (!existingVendor) {
                return res.status(404).send({ success: false, message: 'Vendor not found.' });
            }
        }

        // Check for duplicate invoice number, excluding the current document
        const duplicateInvoice = await Purchase.findOne({ purchaseInvoiceNumber, _id: { $ne: id } });
        if (duplicateInvoice) {
            return res.status(409).send({ success: false, message: 'Another Purchase with this invoice number already exists.' });
        }

        const updateFields = {};

        if (vendorCompanyName !== undefined) updateFields.vendorCompanyName = vendorCompanyName;
        if (productName !== undefined) updateFields.productName = productName;
        if (voucherType !== undefined) updateFields.voucherType = voucherType;
        if (purchaseInvoiceNumber !== undefined) updateFields.purchaseInvoiceNumber = purchaseInvoiceNumber;
        if (narration !== undefined) updateFields.narration = narration;
        if (purchaseDate !== undefined) updateFields.purchaseDate = new Date(purchaseDate);
        if (quantity !== undefined) updateFields.quantity = quantity;
        if (rate !== undefined) updateFields.rate = parseFloat(rate);
        if (freightCharges !== undefined) updateFields.freightCharges = parseFloat(freightCharges);
        if (price !== undefined) updateFields.price = parseFloat(price);
        if (grossTotal !== undefined) updateFields.grossTotal = parseFloat(grossTotal);
        if (roundOff !== undefined) updateFields.roundOff = parseFloat(roundOff);

        const updatedPurchase = await Purchase.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedPurchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Purchase updated successfully', purchase: updatedPurchase });
    } catch (error) {
        console.error("Error in updatePurchase:", error);
        res.status(500).send({ success: false, message: 'Error in updating purchase', error });
    }
};

// Delete Purchase
export const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPurchase = await Purchase.findByIdAndDelete(id);

        if (!deletedPurchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error("Error in deletePurchase:", error);
        res.status(500).send({ success: false, message: 'Error in deleting purchase', error });
    }
};