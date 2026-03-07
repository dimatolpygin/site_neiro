import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModelGenerationForm } from '@/components/models/ModelGenerationForm';
import type { Model } from '@/types/database';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!model) notFound();

  const m = model as Model;

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <Link
        href="/models"
        className="inline-flex items-center gap-2 font-black uppercase text-sm border-2 border-black px-3 py-2 shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform bg-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к моделям
      </Link>

      <div className="border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black uppercase tracking-tight">{m.name}</h1>
        {m.description && (
          <p className="text-gray-600 font-medium mt-2">{m.description}</p>
        )}
      </div>

      <ModelGenerationForm model={m} />
    </div>
  );
}
