import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return NextResponse.json(plans ?? []);
}
