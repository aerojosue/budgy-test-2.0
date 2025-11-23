/*
  # FinTrack Initial Database Schema
  
  ## Overview
  Creates the complete database structure for FinTrack multi-currency family finance application.
  
  ## New Tables
  
  ### 1. profiles
  Extended user profile information beyond Supabase auth.users
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - User email
  - `display_name` (text) - Display name for the user
  - `main_currency` (text) - User's preferred currency (default: USD)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. households
  Represents family or shared financial units
  - `id` (uuid, primary key) - Unique household identifier
  - `name` (text) - Household name
  - `owner_id` (uuid, foreign key) - References profiles(id)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. household_members
  Links users to households with role-based access
  - `id` (uuid, primary key) - Unique member record
  - `household_id` (uuid, foreign key) - References households(id)
  - `user_id` (uuid, foreign key) - References profiles(id)
  - `role` (text) - User role: owner, admin, or member
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 4. categories
  Income and expense categories with icons and colors
  - `id` (uuid, primary key) - Unique category identifier
  - `household_id` (uuid, foreign key) - References households(id)
  - `name` (text) - Category name
  - `type` (text) - Category type: income or expense
  - `icon` (text) - Lucide icon name
  - `color` (text) - Hex color code for UI
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 5. accounts
  Financial accounts (bank, credit card, cash, crypto)
  - `id` (uuid, primary key) - Unique account identifier
  - `household_id` (uuid, foreign key) - References households(id)
  - `name` (text) - Account name
  - `type` (text) - Account type: cash, bank, credit_card, crypto
  - `currency` (text) - Account currency code (USD, EUR, ARS, etc.)
  - `balance` (numeric) - Current account balance
  - `credit_limit` (numeric, nullable) - Credit limit for credit cards
  - `closing_day` (integer, nullable) - Credit card closing day (1-31)
  - `due_day` (integer, nullable) - Credit card payment due day (1-31)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 6. transactions
  All financial transactions (income, expense, transfers)
  - `id` (uuid, primary key) - Unique transaction identifier
  - `household_id` (uuid, foreign key) - References households(id)
  - `account_id` (uuid, foreign key) - References accounts(id)
  - `category_id` (uuid, foreign key, nullable) - References categories(id)
  - `to_account_id` (uuid, foreign key, nullable) - For transfers
  - `amount` (numeric) - Transaction amount
  - `currency` (text) - Transaction currency
  - `exchange_rate` (numeric, nullable) - Rate used for currency conversion
  - `date` (date) - Transaction date
  - `type` (text) - Transaction type: income, expense, transfer
  - `description` (text, nullable) - Transaction notes
  - `is_installment` (boolean) - Whether this is an installment purchase
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 7. installments
  Tracks credit card installment payment schedules
  - `id` (uuid, primary key) - Unique installment record
  - `transaction_id` (uuid, foreign key) - References transactions(id)
  - `total_installments` (integer) - Total number of installments
  - `current_installment` (integer) - Current installment number
  - `installment_amount` (numeric) - Amount per installment
  - `payment_date` (date) - Expected payment date
  - `is_paid` (boolean) - Payment status
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 8. exchange_rates
  Currency exchange rates for multi-currency support
  - `id` (uuid, primary key) - Unique rate record
  - `base_currency` (text) - Base currency code
  - `target_currency` (text) - Target currency code
  - `rate` (numeric) - Exchange rate
  - `rate_type` (text) - Rate type: official, real, custom
  - `effective_date` (date) - Date rate is effective
  - `created_at` (timestamptz) - Record creation timestamp
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies enforce household membership for data access
  - Users can only access data for households they belong to
  - Profile creation automatically creates a personal household
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  main_currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(household_id, user_id)
);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NOT NULL DEFAULT 'circle',
  color text NOT NULL DEFAULT '#7c3aed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'crypto')),
  currency text NOT NULL DEFAULT 'USD',
  balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric,
  closing_day integer CHECK (closing_day BETWEEN 1 AND 31),
  due_day integer CHECK (due_day BETWEEN 1 AND 31),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  exchange_rate numeric,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description text,
  is_installment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create installments table
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  total_installments integer NOT NULL CHECK (total_installments > 0),
  current_installment integer NOT NULL CHECK (current_installment > 0),
  installment_amount numeric NOT NULL,
  payment_date date NOT NULL,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (current_installment <= total_installments)
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  rate_type text NOT NULL DEFAULT 'official' CHECK (rate_type IN ('official', 'real', 'custom')),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency, rate_type, effective_date)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for households
CREATE POLICY "Users can read households they belong to"
  ON households FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Household owners can update their households"
  ON households FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Household owners can delete their households"
  ON households FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for household_members
CREATE POLICY "Users can read household members for their households"
  ON household_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can manage members"
  ON household_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = household_members.household_id
      AND households.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households
      WHERE households.id = household_members.household_id
      AND households.owner_id = auth.uid()
    )
  );

-- RLS Policies for categories
CREATE POLICY "Users can read categories for their households"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Household admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for accounts
CREATE POLICY "Users can read accounts for their households"
  ON accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = accounts.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = accounts.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = accounts.household_id
      AND household_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = accounts.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household admins can delete accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = accounts.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can read transactions for their households"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = transactions.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = transactions.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = transactions.household_id
      AND household_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = transactions.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = transactions.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policies for installments
CREATE POLICY "Users can read installments for their household transactions"
  ON installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN household_members ON household_members.household_id = transactions.household_id
      WHERE transactions.id = installments.transaction_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create installments"
  ON installments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN household_members ON household_members.household_id = transactions.household_id
      WHERE transactions.id = installments.transaction_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update installments"
  ON installments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN household_members ON household_members.household_id = transactions.household_id
      WHERE transactions.id = installments.transaction_id
      AND household_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN household_members ON household_members.household_id = transactions.household_id
      WHERE transactions.id = installments.transaction_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete installments"
  ON installments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN household_members ON household_members.household_id = transactions.household_id
      WHERE transactions.id = installments.transaction_id
      AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policies for exchange_rates
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create exchange rates"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_accounts_household_id ON accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_categories_household_id ON categories(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household_id ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_installments_transaction_id ON installments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_installments_payment_date ON installments(payment_date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);

-- Function to automatically create personal household on user registration
CREATE OR REPLACE FUNCTION create_personal_household()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id uuid;
BEGIN
  INSERT INTO households (name, owner_id)
  VALUES (NEW.display_name || '''s Household', NEW.id)
  RETURNING id INTO new_household_id;
  
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_household();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
