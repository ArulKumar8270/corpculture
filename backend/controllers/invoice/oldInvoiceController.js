import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import OldInvoice from "../../models/oldInvoiceModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Upload and parse Excel file to store old invoices
 * Expected Excel columns:
 * - Invoice No
 * - Date
 * - Customer Name
 * - Customer Mobile
 * - Customer Email
 * - Customer Address
 * - Product Name
 * - Quantity
 * - Price
 * - Total
 * - Payment Status
 * - Payment Method
 * - Payment Date
 * - Payment Amount
 * - Due Amount
 * - Notes
 */
export const uploadOldInvoices = async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.files || !req.files.file) {
            return res.status(400).send({
                success: false,
                message: "No file uploaded. Please upload an Excel file.",
            });
        }

        const file = req.files.file;
        const fileName = file.name;

        // Validate file extension
        const fileExtension = path.extname(fileName).toLowerCase();
        if (!['.xlsx', '.xls', '.csv'].includes(fileExtension)) {
            return res.status(400).send({
                success: false,
                message: "Invalid file type. Please upload an Excel file (.xlsx, .xls, or .csv).",
            });
        }

        // Save file temporarily
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `${Date.now()}_${fileName}`);
        await file.mv(tempFilePath);

        try {
            // Read Excel file
            const workbook = XLSX.readFile(tempFilePath);
            const sheetName = workbook.SheetNames[0]; // Get first sheet
            const worksheet = workbook.Sheets[sheetName];

            // Find the header row by scanning first 15 rows
            // Look for row that contains common header keywords
            let headerRowIndex = 0;
            const headerKeywords = ['invoice', 'customer', 'product', 'date', 'amount', 'price', 'quantity', 'payment', 'mobile', 'email', 'address', 'total', 'due', 'method', 'status'];
            
            // Get the range of the worksheet
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1000');
            
            // First, read as array of arrays to find header row
            const sheetArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            
            // Scan rows to find header row
            for (let row = 0; row < Math.min(15, sheetArray.length); row++) {
                if (!sheetArray[row] || !Array.isArray(sheetArray[row])) continue;
                
                let headerMatchCount = 0;
                const rowValues = sheetArray[row].filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
                
                // Check if this row has enough non-empty cells and matches header keywords
                if (rowValues.length >= 5) {
                    for (const cellValue of rowValues) {
                        const normalizedValue = String(cellValue).toLowerCase().trim();
                        for (const keyword of headerKeywords) {
                            if (normalizedValue.includes(keyword)) {
                                headerMatchCount++;
                                break;
                            }
                        }
                    }
                    
                    // If we found 3+ matches, this is likely the header row
                    if (headerMatchCount >= 3) {
                        headerRowIndex = row;
                        break;
                    }
                }
            }

            // Convert to JSON using the detected header row
            let jsonData;
            if (headerRowIndex > 0) {
                // Create a new worksheet range starting from header row
                // We'll manually create a range string
                const startRow = headerRowIndex;
                const endRow = range.e.r;
                const startCol = 0;
                const endCol = range.e.c;
                
                const newRange = XLSX.utils.encode_range({
                    s: { r: startRow, c: startCol },
                    e: { r: endRow, c: endCol }
                });
                
                // Create a temporary worksheet with the new range
                const tempWorksheet = { ...worksheet };
                tempWorksheet['!ref'] = newRange;
                
                jsonData = XLSX.utils.sheet_to_json(tempWorksheet, {
                    raw: false,
                    defval: null
                });
            } else {
                // Use default (first row as header)
                jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    defval: null
                });
            }

            if (!jsonData || jsonData.length === 0) {
                // Clean up temp file
                fs.unlinkSync(tempFilePath);
                return res.status(400).send({
                    success: false,
                    message: "Excel file is empty or has no data. Could not find header row.",
                    debugInfo: {
                        headerRowIndex,
                        range: worksheet['!ref']
                    }
                });
            }

            // Map Excel columns to database fields
            // Handle different possible column name variations (case-insensitive)
            const columnMapping = {
                'invoiceno': 'invoiceNumber',
                'invoiceno.': 'invoiceNumber',
                'invoicenumber': 'invoiceNumber',
                'invoice': 'invoiceNumber',
                'date': 'date',
                'invoicedate': 'date',
                'customername': 'customerName',
                'customer': 'customerName',
                'customermobile': 'customerMobile',
                'mobile': 'customerMobile',
                'phone': 'customerMobile',
                'customeremail': 'customerEmail',
                'email': 'customerEmail',
                'customeraddress': 'customerAddress',
                'address': 'customerAddress',
                'productname': 'productName',
                'product': 'productName',
                'item': 'productName',
                'quantity': 'quantity',
                'qty': 'quantity',
                'price': 'price',
                'unitprice': 'price',
                'total': 'total',
                'amount': 'total',
                'paymentstatus': 'paymentStatus',
                'status': 'paymentStatus',
                'paymentmethod': 'paymentMethod',
                'method': 'paymentMethod',
                'paymentdate': 'paymentDate',
                'paymentamount': 'paymentAmount',
                'paidamount': 'paymentAmount',
                'dueamount': 'dueAmount',
                'due': 'dueAmount',
                'notes': 'notes',
                'note': 'notes',
                'remarks': 'notes'
            };

            // Helper function to normalize column names for matching
            const normalizeColumnName = (colName) => {
                if (!colName) return '';
                return colName.toString().trim().toLowerCase().replace(/\s+/g, '');
            };

            // Get actual column names from first row for debugging
            const actualColumns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
            const normalizedColumns = actualColumns.map(col => ({
                original: col,
                normalized: normalizeColumnName(col),
                mappedTo: columnMapping[normalizeColumnName(col)] || 'NOT MAPPED'
            }));
            
            // Enhanced column matching - try partial matches for required fields
            const findColumnByPartialMatch = (searchTerms, availableColumns) => {
                for (const col of availableColumns) {
                    const normalized = normalizeColumnName(col);
                    for (const term of searchTerms) {
                        if (normalized.includes(term)) {
                            return col;
                        }
                    }
                }
                return null;
            };
            
            // Try to find required columns using partial matching if exact match fails
            const invoiceNoCol = findColumnByPartialMatch(['invoice', 'inv', 'bill'], actualColumns);
            const customerNameCol = findColumnByPartialMatch(['customer', 'client', 'name', 'party'], actualColumns);
            const productNameCol = findColumnByPartialMatch(['product', 'item', 'goods', 'service'], actualColumns);
            
            // Add these to column mapping if found
            if (invoiceNoCol && !columnMapping[normalizeColumnName(invoiceNoCol)]) {
                columnMapping[normalizeColumnName(invoiceNoCol)] = 'invoiceNumber';
            }
            if (customerNameCol && !columnMapping[normalizeColumnName(customerNameCol)]) {
                columnMapping[normalizeColumnName(customerNameCol)] = 'customerName';
            }
            if (productNameCol && !columnMapping[normalizeColumnName(productNameCol)]) {
                columnMapping[normalizeColumnName(productNameCol)] = 'productName';
            }

            // Process and save invoices
            const savedInvoices = [];
            const errors = [];
            let rowIndex = 0;

            for (const row of jsonData) {
                rowIndex++;
                try {
                    // Map columns to database fields
                    const invoiceData = {};
                    const rowKeys = Object.keys(row);

                    // Find matching columns using normalized names
                    for (const excelKey of rowKeys) {
                        const normalizedKey = normalizeColumnName(excelKey);
                        let mappedKey = columnMapping[normalizedKey];
                        
                        // If no exact match, try partial matching for required fields
                        if (!mappedKey) {
                            // Try to match by partial name for critical fields
                            if (normalizedKey.includes('invoice') || normalizedKey.includes('inv') || normalizedKey.includes('bill')) {
                                mappedKey = 'invoiceNumber';
                            } else if (normalizedKey.includes('customer') || normalizedKey.includes('client') || (normalizedKey.includes('name') && !normalizedKey.includes('product'))) {
                                mappedKey = 'customerName';
                            } else if (normalizedKey.includes('product') || normalizedKey.includes('item') || normalizedKey.includes('goods') || normalizedKey.includes('service')) {
                                mappedKey = 'productName';
                            } else if (normalizedKey.includes('date') && !normalizedKey.includes('payment')) {
                                mappedKey = 'date';
                            } else if (normalizedKey.includes('mobile') || normalizedKey.includes('phone')) {
                                mappedKey = 'customerMobile';
                            } else if (normalizedKey.includes('email')) {
                                mappedKey = 'customerEmail';
                            } else if (normalizedKey.includes('address')) {
                                mappedKey = 'customerAddress';
                            } else if (normalizedKey.includes('quantity') || normalizedKey.includes('qty')) {
                                mappedKey = 'quantity';
                            } else if (normalizedKey.includes('price') && !normalizedKey.includes('payment')) {
                                mappedKey = 'price';
                            } else if (normalizedKey.includes('total') && !normalizedKey.includes('payment') && !normalizedKey.includes('due')) {
                                mappedKey = 'total';
                            } else if (normalizedKey.includes('payment') && normalizedKey.includes('status')) {
                                mappedKey = 'paymentStatus';
                            } else if (normalizedKey.includes('payment') && normalizedKey.includes('method')) {
                                mappedKey = 'paymentMethod';
                            } else if (normalizedKey.includes('payment') && normalizedKey.includes('date')) {
                                mappedKey = 'paymentDate';
                            } else if (normalizedKey.includes('payment') && normalizedKey.includes('amount')) {
                                mappedKey = 'paymentAmount';
                            } else if (normalizedKey.includes('due') && normalizedKey.includes('amount')) {
                                mappedKey = 'dueAmount';
                            } else if (normalizedKey.includes('note') || normalizedKey.includes('remark')) {
                                mappedKey = 'notes';
                            }
                        }
                        
                        if (mappedKey) {
                            const cellValue = row[excelKey];
                            // Only add if value exists and is not empty
                            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                                // Check if it's a string and not just whitespace
                                if (typeof cellValue === 'string' && cellValue.trim() === '') {
                                    continue;
                                }
                                invoiceData[mappedKey] = cellValue;
                            }
                        }
                    }

                    // Validate required fields
                    // Try to find product name in unmapped columns if not found
                    if (!invoiceData.productName) {
                        // Look for any column that might contain product info
                        for (const excelKey of rowKeys) {
                            const normalizedKey = normalizeColumnName(excelKey);
                            const cellValue = row[excelKey];
                            
                            // Skip if already mapped or empty
                            if (invoiceData[columnMapping[normalizedKey]] || !cellValue || 
                                (typeof cellValue === 'string' && cellValue.trim() === '')) {
                                continue;
                            }
                            
                            // Try to match product-related columns more aggressively
                            if (normalizedKey.includes('product') || 
                                normalizedKey.includes('item') || 
                                normalizedKey.includes('goods') || 
                                normalizedKey.includes('service') ||
                                normalizedKey.includes('description') ||
                                normalizedKey.includes('particular') ||
                                normalizedKey.includes('detail') ||
                                normalizedKey.includes('name') && !normalizedKey.includes('customer')) {
                                invoiceData.productName = cellValue;
                                break;
                            }
                        }
                        
                        // If still not found, try using the first unmapped non-empty column as product name
                        if (!invoiceData.productName) {
                            for (const excelKey of rowKeys) {
                                const normalizedKey = normalizeColumnName(excelKey);
                                if (columnMapping[normalizedKey]) continue; // Skip already mapped
                                
                                const cellValue = row[excelKey];
                                if (cellValue && 
                                    (typeof cellValue !== 'string' || cellValue.trim() !== '') &&
                                    !normalizedKey.includes('date') &&
                                    !normalizedKey.includes('amount') &&
                                    !normalizedKey.includes('total') &&
                                    !normalizedKey.includes('payment') &&
                                    !normalizedKey.includes('mobile') &&
                                    !normalizedKey.includes('email') &&
                                    !normalizedKey.includes('address') &&
                                    !normalizedKey.includes('quantity') &&
                                    !normalizedKey.includes('price') &&
                                    !normalizedKey.includes('due') &&
                                    !normalizedKey.includes('note')) {
                                    invoiceData.productName = cellValue;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (!invoiceData.invoiceNumber || !invoiceData.customerName || !invoiceData.productName) {
                        // For first few errors, include detailed information
                        const errorInfo = {
                            row: rowIndex,
                            error: `Missing required fields. Found: Invoice No=${!!invoiceData.invoiceNumber}, Customer Name=${!!invoiceData.customerName}, Product Name=${!!invoiceData.productName}`,
                            foundFields: Object.keys(invoiceData),
                            rowData: rowIndex <= 5 ? row : undefined, // Show first 5 rows' data for debugging
                            availableColumns: rowIndex <= 5 ? actualColumns : undefined,
                            columnMapping: rowIndex <= 5 ? normalizedColumns.map(col => ({
                                ...col,
                                value: rowIndex <= 5 ? row[col.original] : undefined
                            })) : undefined,
                            unmappedColumns: rowIndex <= 5 ? actualColumns.filter(col => {
                                const normalized = normalizeColumnName(col);
                                return !columnMapping[normalized] && row[col] && 
                                       (typeof row[col] !== 'string' || row[col].trim() !== '');
                            }) : undefined
                        };
                        errors.push(errorInfo);
                        continue;
                    }

                    // Parse and format data
                    // Date parsing - Excel dates are stored as serial numbers
                    if (invoiceData.date) {
                        let parsedDate;
                        if (typeof invoiceData.date === 'number') {
                            // Excel date serial number (days since 1900-01-01)
                            // Excel epoch is 1899-12-30
                            const excelEpoch = new Date(1899, 11, 30);
                            parsedDate = new Date(excelEpoch.getTime() + invoiceData.date * 86400000);
                        } else {
                            parsedDate = new Date(invoiceData.date);
                        }
                        
                        if (isNaN(parsedDate.getTime())) {
                            errors.push({
                                row: rowIndex,
                                error: `Invalid date format: ${invoiceData.date}`,
                                data: row
                            });
                            continue;
                        }
                        invoiceData.date = parsedDate;
                    }

                    // Payment Date parsing
                    if (invoiceData.paymentDate) {
                        let parsedDate;
                        if (typeof invoiceData.paymentDate === 'number') {
                            // Excel date serial number
                            const excelEpoch = new Date(1899, 11, 30);
                            parsedDate = new Date(excelEpoch.getTime() + invoiceData.paymentDate * 86400000);
                        } else {
                            parsedDate = new Date(invoiceData.paymentDate);
                        }
                        
                        if (isNaN(parsedDate.getTime())) {
                            invoiceData.paymentDate = null;
                        } else {
                            invoiceData.paymentDate = parsedDate;
                        }
                    }

                    // Convert numeric fields
                    if (invoiceData.quantity) {
                        invoiceData.quantity = parseFloat(invoiceData.quantity) || 1;
                    }
                    if (invoiceData.price) {
                        invoiceData.price = parseFloat(invoiceData.price) || 0;
                    }
                    if (invoiceData.total) {
                        invoiceData.total = parseFloat(invoiceData.total) || 0;
                    }
                    if (invoiceData.paymentAmount) {
                        invoiceData.paymentAmount = parseFloat(invoiceData.paymentAmount) || 0;
                    }
                    if (invoiceData.dueAmount) {
                        invoiceData.dueAmount = parseFloat(invoiceData.dueAmount) || 0;
                    }

                    // Normalize payment status
                    if (invoiceData.paymentStatus) {
                        const status = invoiceData.paymentStatus.toString().trim();
                        if (status.toLowerCase().includes('paid') && !status.toLowerCase().includes('unpaid')) {
                            invoiceData.paymentStatus = 'Paid';
                        } else if (status.toLowerCase().includes('unpaid')) {
                            invoiceData.paymentStatus = 'Unpaid';
                        } else if (status.toLowerCase().includes('partial')) {
                            invoiceData.paymentStatus = 'Partial';
                        } else {
                            invoiceData.paymentStatus = 'Pending';
                        }
                    }

                    // Add metadata
                    invoiceData.excelRowIndex = rowIndex;
                    invoiceData.isImported = true;
                    invoiceData.uploadedFileName = fileName;

                    // Check if invoice already exists (optional: skip duplicates)
                    const existingInvoice = await OldInvoice.findOne({
                        invoiceNumber: invoiceData.invoiceNumber,
                        productName: invoiceData.productName,
                        date: invoiceData.date
                    });

                    if (existingInvoice) {
                        errors.push({
                            row: rowIndex,
                            error: `Invoice already exists: ${invoiceData.invoiceNumber}`,
                            data: row
                        });
                        continue;
                    }

                    // Create and save invoice
                    const invoice = new OldInvoice(invoiceData);
                    await invoice.save();
                    savedInvoices.push(invoice);

                } catch (error) {
                    errors.push({
                        row: rowIndex,
                        error: error.message || 'Unknown error',
                        data: row
                    });
                }
            }

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            // Return response with column information for debugging
            const response = {
                success: true,
                message: `Successfully imported ${savedInvoices.length} invoices. ${errors.length} rows had errors.`,
                imported: savedInvoices.length,
                errors: errors.length,
                errorDetails: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
                invoices: savedInvoices.slice(0, 10) // Return first 10 saved invoices
            };

            // Add column information if there were errors
            if (errors.length > 0) {
                // Show what columns were found and their values in first row
                const firstRowData = jsonData.length > 0 ? jsonData[0] : {};
                const columnValues = {};
                for (const col of actualColumns) {
                    columnValues[col] = firstRowData[col];
                }
                
                response.debugInfo = {
                    headerRowIndex: headerRowIndex,
                    actualColumns: actualColumns,
                    normalizedColumns: normalizedColumns,
                    columnMapping: Object.keys(columnMapping).map(key => ({
                        normalized: key,
                        mapsTo: columnMapping[key]
                    })),
                    firstRowSample: firstRowData,
                    firstRowColumnValues: columnValues, // Show actual values from first row
                    firstFewRows: jsonData.slice(0, 3), // Show first 3 rows for debugging
                    suggestedMappings: {
                        invoiceNo: invoiceNoCol || 'NOT FOUND',
                        customerName: customerNameCol || 'NOT FOUND',
                        productName: productNameCol || 'NOT FOUND'
                    }
                };
            }

            res.status(200).send(response);

        } catch (parseError) {
            // Clean up temp file
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            console.error("Error parsing Excel file:", parseError);
            return res.status(400).send({
                success: false,
                message: "Error parsing Excel file. Please ensure the file is a valid Excel format.",
                error: parseError.message
            });
        }

    } catch (error) {
        console.error("Error in uploadOldInvoices:", error);
        res.status(500).send({
            success: false,
            message: "Error uploading and processing Excel file",
            error: error.message
        });
    }
};

/**
 * Get all old invoices with pagination and filters
 */
export const getAllOldInvoices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            invoiceNumber,
            customerName,
            paymentStatus,
            startDate,
            endDate,
            remainderDate,
            minRemainderDate,
            maxRemainderDate
        } = req.query;

        // Build query
        const query = {};

        if (invoiceNumber) {
            query.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
        }
        if (customerName) {
            query.customerName = { $regex: customerName, $options: 'i' };
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        
        // Filter by remainderDate (days)
        if (remainderDate !== undefined && remainderDate !== null && remainderDate !== '') {
            // Exact match
            query.remainderDate = parseInt(remainderDate);
        } else if (minRemainderDate !== undefined || maxRemainderDate !== undefined) {
            // Range query
            query.remainderDate = {};
            if (minRemainderDate !== undefined && minRemainderDate !== '') {
                query.remainderDate.$gte = parseInt(minRemainderDate);
            }
            if (maxRemainderDate !== undefined && maxRemainderDate !== '') {
                query.remainderDate.$lte = parseInt(maxRemainderDate);
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await OldInvoice.countDocuments(query);

        // Fetch invoices
        const invoices = await OldInvoice.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).send({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            invoices
        });

    } catch (error) {
        console.error("Error in getAllOldInvoices:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching old invoices",
            error: error.message
        });
    }
};

/**
 * Get single old invoice by ID
 */
export const getOldInvoiceById = async (req, res) => {
    try {
        const invoice = await OldInvoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Old invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            invoice
        });

    } catch (error) {
        console.error("Error in getOldInvoiceById:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching old invoice",
            error: error.message
        });
    }
};

/**
 * Update old invoice
 */
export const updateOldInvoice = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Convert remainderDate to number if provided
        if (updateData.remainderDate !== undefined && updateData.remainderDate !== null) {
            updateData.remainderDate = parseInt(updateData.remainderDate) || null;
        }

        // Validate and normalize sentEmailList
        if (updateData.sentEmailList !== undefined) {
            if (Array.isArray(updateData.sentEmailList)) {
                // Normalize emails: trim, lowercase, and filter out empty values
                updateData.sentEmailList = updateData.sentEmailList
                    .map(email => email ? email.trim().toLowerCase() : null)
                    .filter(email => email && email.includes('@'));
            } else {
                // If not an array, set to empty array
                updateData.sentEmailList = [];
            }
        }

        const invoice = await OldInvoice.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Old invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            message: "Old invoice updated successfully",
            invoice
        });

    } catch (error) {
        console.error("Error in updateOldInvoice:", error);
        res.status(500).send({
            success: false,
            message: "Error updating old invoice",
            error: error.message
        });
    }
};

/**
 * Delete old invoice
 */
export const deleteOldInvoice = async (req, res) => {
    try {
        const invoice = await OldInvoice.findByIdAndDelete(req.params.id);

        if (!invoice) {
            return res.status(404).send({
                success: false,
                message: "Old invoice not found"
            });
        }

        res.status(200).send({
            success: true,
            message: "Old invoice deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteOldInvoice:", error);
        res.status(500).send({
            success: false,
            message: "Error deleting old invoice",
            error: error.message
        });
    }
};

/**
 * Delete all old invoices (use with caution)
 */
export const deleteAllOldInvoices = async (req, res) => {
    try {
        const result = await OldInvoice.deleteMany({});

        res.status(200).send({
            success: true,
            message: `Deleted ${result.deletedCount} old invoices`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("Error in deleteAllOldInvoices:", error);
        res.status(500).send({
            success: false,
            message: "Error deleting old invoices",
            error: error.message
        });
    }
};

/**
 * Get invoices by remainderDate (days)
 * Useful for finding invoices that need remainder notifications
 */
export const getInvoicesByRemainderDate = async (req, res) => {
    try {
        const { remainderDate, hasRemainderDate } = req.query;

        // Build query
        const query = {};

        if (remainderDate !== undefined && remainderDate !== null && remainderDate !== '') {
            // Get invoices with specific remainder date (days)
            query.remainderDate = parseInt(remainderDate);
        } else if (hasRemainderDate === 'true' || hasRemainderDate === true) {
            // Get all invoices that have a remainderDate set (not null/undefined)
            query.remainderDate = { $exists: true, $ne: null };
        } else if (hasRemainderDate === 'false' || hasRemainderDate === false) {
            // Get all invoices that don't have a remainderDate set
            query.$or = [
                { remainderDate: { $exists: false } },
                { remainderDate: null }
            ];
        }

        // Fetch invoices
        const invoices = await OldInvoice.find(query)
            .sort({ remainderDate: 1, date: -1 })
            .limit(1000); // Limit to prevent too many results

        res.status(200).send({
            success: true,
            count: invoices.length,
            invoices
        });

    } catch (error) {
        console.error("Error in getInvoicesByRemainderDate:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching invoices by remainder date",
            error: error.message
        });
    }
};

