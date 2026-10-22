import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (file, resourceType, folder) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result?.secure_url || !result?.public_id) {
                    return reject(
                        new Error(
                            "Cloudinary did not return the uploaded asset.",
                        ),
                    );
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                });
            },
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });

export default uploadToCloudinary;
