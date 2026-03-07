export type GenerationType = 'image' | 'video';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TransactionType = 'topup' | 'deduction' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: GenerationType;
  status: GenerationStatus;
  prompt: string;
  parameters: Record<string, unknown>;
  cost_kopecks: number;
  job_id: string | null;
  result_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_kopecks: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  yookassa_payment_id: string | null;
  yookassa_payment_url: string | null;
  generation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelPricing {
  id: string;
  model_id: string;
  display_name: string;
  type: GenerationType;
  cost_kopecks: number;
  is_active: boolean;
}

export interface ModelSize { label: string; value: string; }
export interface ModelQuality { label: string; value: string; cost_kopecks?: number; }
export interface ModelDuration { label: string; value: number; }

export interface Model {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: 'image' | 'video' | 'edit';
  endpoint: string;
  cost_kopecks: number;
  supports_image_input: boolean;
  available_sizes: ModelSize[];
  available_quality: ModelQuality[];
  available_durations: ModelDuration[];
  templates: string[];
  preview_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface News {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  model_slug?: string;
  tags: string[];
  published_at: string;
  is_active: boolean;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  topup_kopecks: number;
  bonus_kopecks: number;
  is_active: boolean;
  sort_order: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      generations: {
        Row: Generation;
        Insert: Omit<Generation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Generation, 'id' | 'created_at'>>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
        Relationships: [];
      };
      model_pricing: {
        Row: ModelPricing;
        Insert: Omit<ModelPricing, 'id'>;
        Update: Partial<Omit<ModelPricing, 'id'>>;
        Relationships: [];
      };
      pricing_plans: {
        Row: PricingPlan;
        Insert: Omit<PricingPlan, 'id'>;
        Update: Partial<Omit<PricingPlan, 'id'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      deduct_balance: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_generation_id: string;
          p_description: string;
        };
        Returns: boolean;
      };
      credit_balance: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_yookassa_id: string;
          p_description: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      generation_type: GenerationType;
      generation_status: GenerationStatus;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
