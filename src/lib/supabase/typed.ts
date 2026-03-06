/**
 * Typed wrappers for Supabase query results.
 * Used because @supabase/ssr v0.9 bundles its own @supabase/supabase-js version
 * that may conflict with the manually installed one's type system.
 */
import type { Profile, Generation, Transaction, ModelPricing, PricingPlan } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asProfile(data: any): Profile | null {
  return data as Profile | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asGeneration(data: any): Generation | null {
  return data as Generation | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asGenerations(data: any): Generation[] {
  return (data ?? []) as Generation[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asTransactions(data: any): Transaction[] {
  return (data ?? []) as Transaction[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asModelPricings(data: any): ModelPricing[] {
  return (data ?? []) as ModelPricing[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asPricingPlans(data: any): PricingPlan[] {
  return (data ?? []) as PricingPlan[];
}
