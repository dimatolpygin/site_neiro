import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!(profile as Profile | null)?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { slug, title, description, content, image_url, model_slug, tags } = body;

  if (!slug || !title || !description) {
    return NextResponse.json({ error: 'slug, title, description обязательны' }, { status: 400 });
  }

  const { error } = await supabase.from('news').insert({
    slug,
    title,
    description,
    content: content || null,
    image_url: image_url || null,
    model_slug: model_slug || null,
    tags: tags ?? [],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!(profile as Profile | null)?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, slug, title, description, content, image_url, model_slug, tags } = body;

  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 });

  const { error } = await supabase.from('news').update({
    slug,
    title,
    description,
    content: content || null,
    image_url: image_url || null,
    model_slug: model_slug || null,
    tags: tags ?? [],
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
