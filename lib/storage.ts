import { supabase } from './supabase';

const BUCKET = 'scan-uploads';

export async function uploadScanImage(
  buffer:   Buffer,
  mimeType: string,
  userId:   string,
): Promise<{ path: string; publicUrl: string; error?: string }> {
  const ext  = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) return { path: '', publicUrl: '', error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: urlData?.publicUrl ?? '' };
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? '';
}
