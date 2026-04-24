import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';

const maxImageBytes = 5 * 1024 * 1024;

const allowedTypes: Record<string, { extension: string; signatures: number[][] }> = {
  'image/jpeg': { extension: 'jpg', signatures: [[0xff, 0xd8, 0xff]] },
  'image/png': { extension: 'png', signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/webp': { extension: 'webp', signatures: [[0x52, 0x49, 0x46, 0x46]] }
};

export interface ProductImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

function hasSignature(buffer: Buffer, signatures: number[][]): boolean {
  return signatures.some((signature) => signature.every((byte, index) => buffer[index] === byte));
}

export function validateProductImage(file: ProductImageFile | undefined): ProductImageFile {
  if (!file) throw new ApiError(422, 'VALIDATION_ERROR', 'image file is required');
  if (file.size <= 0) throw new ApiError(422, 'VALIDATION_ERROR', 'image file is empty');
  if (file.size > maxImageBytes) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'image file must be 5 MB or smaller');

  const typeConfig = allowedTypes[file.mimetype];
  if (!typeConfig || !hasSignature(file.buffer, typeConfig.signatures)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'image must be a valid JPEG, PNG or WebP file');
  }
  return file;
}

export async function uploadProductImage(companyId: string, productId: string, file: ProductImageFile | undefined): Promise<string> {
  const image = validateProductImage(file);
  const typeConfig = allowedTypes[image.mimetype];

  if (process.env.VITEST === 'true' || env.dataProvider !== 'supabase') {
    return `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
  }

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new ApiError(500, 'CONFIG_ERROR', 'Supabase storage is not configured');
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const storagePath = `${companyId}/products/${productId}/${Date.now()}-${randomUUID()}.${typeConfig.extension}`;
  const { error } = await supabase.storage.from(env.supabaseMediaBucket).upload(storagePath, image.buffer, {
    contentType: image.mimetype,
    cacheControl: '31536000',
    upsert: false
  });
  if (error) throw new ApiError(500, 'STORAGE_ERROR', error.message);

  const { data } = supabase.storage.from(env.supabaseMediaBucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
