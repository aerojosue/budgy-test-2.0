export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          main_currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          main_currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          main_currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'crypto'
          currency: string
          balance: number
          credit_limit: number | null
          closing_day: number | null
          due_day: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'crypto'
          currency?: string
          balance?: number
          credit_limit?: number | null
          closing_day?: number | null
          due_day?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          type?: 'cash' | 'bank' | 'credit_card' | 'crypto'
          currency?: string
          balance?: number
          credit_limit?: number | null
          closing_day?: number | null
          due_day?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          account_id: string
          category_id: string | null
          to_account_id: string | null
          amount: number
          currency: string
          exchange_rate: number | null
          date: string
          type: 'income' | 'expense' | 'transfer'
          description: string | null
          is_installment: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          account_id: string
          category_id?: string | null
          to_account_id?: string | null
          amount: number
          currency: string
          exchange_rate?: number | null
          date: string
          type: 'income' | 'expense' | 'transfer'
          description?: string | null
          is_installment?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          account_id?: string
          category_id?: string | null
          to_account_id?: string | null
          amount?: number
          currency?: string
          exchange_rate?: number | null
          date?: string
          type?: 'income' | 'expense' | 'transfer'
          description?: string | null
          is_installment?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      installments: {
        Row: {
          id: string
          transaction_id: string
          total_installments: number
          current_installment: number
          installment_amount: number
          payment_date: string
          is_paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          total_installments: number
          current_installment: number
          installment_amount: number
          payment_date: string
          is_paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          total_installments?: number
          current_installment?: number
          installment_amount?: number
          payment_date?: string
          is_paid?: boolean
          created_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          base_currency: string
          target_currency: string
          rate: number
          rate_type: 'official' | 'real' | 'custom'
          effective_date: string
          created_at: string
        }
        Insert: {
          id?: string
          base_currency: string
          target_currency: string
          rate: number
          rate_type?: 'official' | 'real' | 'custom'
          effective_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          base_currency?: string
          target_currency?: string
          rate?: number
          rate_type?: 'official' | 'real' | 'custom'
          effective_date?: string
          created_at?: string
        }
      }
    }
  }
}
