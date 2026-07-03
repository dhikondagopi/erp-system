const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

class UploadController {
  uploadFile = async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 'No file was uploaded.', 400);
      }

      const { entityType, entityId } = req.body;
      const file = req.file;

      const fileExt = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${uniqueSuffix}${fileExt}`;

      let fileUrl = '';
      let isSupabaseUploaded = false;

      // 1. Attempt upload to Supabase Storage if credentials exist
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (
        supabaseUrl &&
        supabaseKey &&
        supabaseUrl !== 'your_supabase_url_here' &&
        !supabaseUrl.toLowerCase().includes('placeholder')
      ) {
        try {
          const bucketName = 'erp-assets';
          const cleanUrl = supabaseUrl.replace(/\/$/, '');
          const uploadEndpoint = `${cleanUrl}/storage/v1/object/${bucketName}/${fileName}`;

          // Native fetch request
          const response = await fetch(uploadEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apiKey': supabaseKey,
              'Content-Type': file.mimetype
            },
            body: file.buffer
          });

          if (response.ok) {
            fileUrl = `${cleanUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
            isSupabaseUploaded = true;
            console.log(`[UploadController] Uploaded ${fileName} to Supabase Storage: ${fileUrl}`);
          } else {
            const errText = await response.text();
            console.warn(`[UploadController] Supabase upload failed (status ${response.status}): ${errText}`);
          }
        } catch (supabaseErr) {
          console.warn(`[UploadController] Supabase upload error: ${supabaseErr.message}`);
        }
      }

      // 2. Local fallback if Supabase not configured or failed
      if (!isSupabaseUploaded) {
        const uploadsDir = path.join(__dirname, '../uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });

        const localPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localPath, file.buffer);

        fileUrl = `/uploads/${fileName}`;
        console.log(`[UploadController] Saved ${fileName} locally to uploads: ${fileUrl}`);
      }

      // 3. Optional Database Update
      if (entityType && entityId) {
        let updateSql = '';
        let tableName = '';

        if (entityType === 'products' || entityType === 'product') {
          updateSql = 'UPDATE products SET image_url = $1 WHERE id = $2 RETURNING *';
          tableName = 'products';
        } else if (entityType === 'purchase-orders' || entityType === 'purchase_orders') {
          updateSql = 'UPDATE purchase_orders SET attachment_url = $1 WHERE id = $2 RETURNING *';
          tableName = 'purchase_orders';
        } else if (entityType === 'manufacturing-orders' || entityType === 'manufacturing_orders') {
          updateSql = 'UPDATE manufacturing_orders SET document_url = $1 WHERE id = $2 RETURNING *';
          tableName = 'manufacturing_orders';
        }

        if (updateSql) {
          const dbRes = await query(updateSql, [fileUrl, entityId]);
          if (dbRes.rows.length === 0) {
            console.warn(`[UploadController] Entity with ID '${entityId}' not found in table '${tableName}'. File was uploaded but DB reference was not saved.`);
          } else {
            console.log(`[UploadController] Reference URL successfully saved in table '${tableName}' for entity ID ${entityId}.`);
          }
        }
      }

      return sendSuccess(res, 'File uploaded successfully', {
        url: fileUrl,
        storage: isSupabaseUploaded ? 'supabase' : 'local',
        fileName
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UploadController();
