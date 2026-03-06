import { createClient } from './client';

export async function uploadImageForEdit(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('uploads').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Ошибка загрузки файла: ${error.message}`);

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}
