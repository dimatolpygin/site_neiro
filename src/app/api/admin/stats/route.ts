import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Profile, Transaction } from '@/types/database';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const profile = profileData as Profile | null;

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createServiceClient();

  const [
    { count: usersCount },
    { count: generationsCount },
    { data: revenueData },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('generations').select('id', { count: 'exact', head: true }),
    admin.from('transactions')
      .select('amount_kopecks')
      .eq('type', 'topup')
      .eq('status', 'completed'),
  ]);

  const transactions = (revenueData ?? []) as Pick<Transaction, 'amount_kopecks'>[];
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount_kopecks, 0);

  return NextResponse.json({
    usersCount: usersCount ?? 0,
    generationsCount: generationsCount ?? 0,
    totalRevenueKopecks: totalRevenue,
  });
}
