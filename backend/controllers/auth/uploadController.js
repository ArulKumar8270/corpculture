import AWS from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudflare R2 (S3-compatible API)
const s3 = new AWS.S3({
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
    region: "auto", // Cloudflare R2 typically uses 'auto' or a specific region if defined
});

/**
 * Controller to handle file uploads to Cloudflare R2.
 * This function expects a file to be present in `req.file` (handled by multer middleware).
 */
export const uploadFileController = async (req, res) => {
    try {
        // Check if a file was actually uploaded by multer
        if (!req.files) {
            return res.status(400).send({
                success: false,
                message: "No file uploaded. Please ensure the 'file' field is present in the form data.",
            });
        }
        const file = req.files.file
        const uploadPath = `temp/${file.name}`;
        await file.mv(uploadPath);
        // Read the file content from the temporary path
        const fileContent = fs.readFileSync(uploadPath);

        // Parameters for S3 upload
        const params = {
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME, // Your R2 bucket name
            Key: file?.name, // The name the file will have in R2
            Body: fileContent, // The file content
            ContentType: file?.mimetype, // The MIME type of the file
        };

        // Upload the file to R2
        const data = await s3.upload(params).promise();

        // Remove the temporary file from the local server after successful upload
        fs.unlinkSync(uploadPath);

        // Send success response with the URL of the uploaded file
        res.status(200).send({
            success: true,
            message: "File uploaded successfully!",
            fileUrl: `https://pub-48d3e9677d09450a9113bb7bddbe02c8.r2.dev/${file?.name}`, // The public URL of the uploaded file on R2
        });
    } catch (error) {
        console.error("File Upload Error: ", error); // Added console.error for debugging
        res.status(500).send({
            success: false,
            message: "Error uploading file.",
            error: error.message, // Provide the error message for debugging
        });
    }
};

/**
 * Controller to handle file deletions from Cloudflare R2.
 * This function expects the file name (key) to be provided in the request parameters.
 */
export const deleteFileController = async (req, res) => {
    try {
        const { fileName } = req.params; // Assuming fileName is passed as a URL parameter

        if (!fileName) {
            return res.status(400).send({
                success: false,
                message: "File name is required for deletion.",
            });
        }

        const params = {
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME, // Your R2 bucket name
            Key: fileName, // The name of the file to delete
        };

        await s3.deleteObject(params).promise();

        res.status(200).send({
            success: true,
            message: `File '${fileName}' deleted successfully from R2.`,
        });
    } catch (error) {
        console.error("File Deletion Error: ", error);
        res.status(500).send({
            success: false,
            message: "Error deleting file.",
            error: error.message,
        });
    }
};
