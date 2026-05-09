import { v2 as cloudinary } from 'cloudinary';

// Using standard dotenv loading since config might be imported early
import dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/../.env' }); // Adjust if needed based on execution context

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
