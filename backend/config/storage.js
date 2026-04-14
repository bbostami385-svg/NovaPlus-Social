import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Storage provider enum
export const STORAGE_PROVIDERS = {
  R2: 'r2',
  S3: 's3',
  GCS: 'gcs',
};

// Get current storage provider
const getCurrentProvider = () => {
  return process.env.STORAGE_PROVIDER || STORAGE_PROVIDERS.R2;
};

// Initialize R2 (Cloudflare)
const initializeR2 = () => {
  return new AWS.S3({
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_ENDPOINT,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });
};

// Initialize AWS S3
const initializeS3 = () => {
  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
};

// Get S3 client based on provider
const getS3Client = () => {
  const provider = getCurrentProvider();

  if (provider === STORAGE_PROVIDERS.R2) {
    return initializeR2();
  } else if (provider === STORAGE_PROVIDERS.S3) {
    return initializeS3();
  }

  throw new Error(`Unsupported storage provider: ${provider}`);
};

// Upload file to storage
export const uploadFile = async (file, folder = 'uploads') => {
  try {
    const s3 = getS3Client();
    const provider = getCurrentProvider();

    const fileName = `${folder}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    const bucketName =
      provider === STORAGE_PROVIDERS.R2 ? process.env.R2_BUCKET_NAME : process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();

    // Generate public URL
    let publicUrl;
    if (provider === STORAGE_PROVIDERS.R2) {
      publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    } else {
      publicUrl = result.Location;
    }

    return {
      success: true,
      url: publicUrl,
      key: fileName,
      provider,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Delete file from storage
export const deleteFile = async (fileKey) => {
  try {
    const s3 = getS3Client();
    const provider = getCurrentProvider();
    const bucketName =
      provider === STORAGE_PROVIDERS.R2 ? process.env.R2_BUCKET_NAME : process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
    };

    await s3.deleteObject(params).promise();

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

// Get file URL
export const getFileUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const s3 = getS3Client();
    const provider = getCurrentProvider();
    const bucketName =
      provider === STORAGE_PROVIDERS.R2 ? process.env.R2_BUCKET_NAME : process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Expires: expiresIn,
    };

    const url = await s3.getSignedUrlPromise('getObject', params);

    return {
      success: true,
      url,
      expiresIn,
    };
  } catch (error) {
    console.error('Get URL error:', error);
    throw new Error(`Failed to get file URL: ${error.message}`);
  }
};

// Batch upload files
export const batchUploadFiles = async (files, folder = 'uploads') => {
  try {
    const uploadPromises = files.map((file) => uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw new Error(`Batch upload failed: ${error.message}`);
  }
};

// Copy file (for migrations)
export const copyFile = async (sourceKey, destinationKey) => {
  try {
    const s3 = getS3Client();
    const provider = getCurrentProvider();
    const bucketName =
      provider === STORAGE_PROVIDERS.R2 ? process.env.R2_BUCKET_NAME : process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
      ACL: 'public-read',
    };

    await s3.copyObject(params).promise();

    return {
      success: true,
      message: 'File copied successfully',
    };
  } catch (error) {
    console.error('Copy error:', error);
    throw new Error(`File copy failed: ${error.message}`);
  }
};

// List files in folder
export const listFiles = async (folder, maxKeys = 100) => {
  try {
    const s3 = getS3Client();
    const provider = getCurrentProvider();
    const bucketName =
      provider === STORAGE_PROVIDERS.R2 ? process.env.R2_BUCKET_NAME : process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      Prefix: folder,
      MaxKeys: maxKeys,
    };

    const result = await s3.listObjectsV2(params).promise();

    return {
      success: true,
      files: result.Contents || [],
      count: result.Contents?.length || 0,
    };
  } catch (error) {
    console.error('List error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

export default {
  uploadFile,
  deleteFile,
  getFileUrl,
  batchUploadFiles,
  copyFile,
  listFiles,
  getCurrentProvider,
};
