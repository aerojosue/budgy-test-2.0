import { supabase } from './supabase';
import Decimal from 'decimal.js';

export async function seedUserData(userId: string, householdId: string) {
  try {
    const accountIds: Record<string, string> = {};
    const categoryIds: Record<string, string> = {};

    // 1. Create Categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Salary', type: 'income', icon: 'briefcase', color: '#14b8a6' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#10b981' },
      { name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#f43f5e' },
      { name: 'Transportation', type: 'expense', icon: 'car', color: '#f59e0b' },
      { name: 'Restaurants', type: 'expense', icon: 'utensils', color: '#ec4899' },
      { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#8b5cf6' },
      { name: 'Entertainment', type: 'expense', icon: 'film', color: '#6366f1' },
      { name: 'Bills', type: 'expense', icon: 'receipt', color: '#ef4444' },
    ];

    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          household_id: householdId,
          name: category.name,
          type: category.type as 'income' | 'expense',
          icon: category.icon,
          color: category.color,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', category.name, error);
      } else if (data) {
        categoryIds[category.name] = data.id;
      }
    }

    // 2. Create Exchange Rates
    console.log('Creating exchange rates...');
    const exchangeRates = [
      { base: 'USD', target: 'ARS', rate: 1000, type: 'real' },
      { base: 'USD', target: 'BRL', rate: 5, type: 'real' },
      { base: 'ARS', target: 'USD', rate: 0.001, type: 'real' },
      { base: 'BRL', target: 'USD', rate: 0.2, type: 'real' },
      { base: 'USD', target: 'USD', rate: 1, type: 'official' },
      { base: 'ARS', target: 'ARS', rate: 1, type: 'official' },
      { base: 'BRL', target: 'BRL', rate: 1, type: 'official' },
    ];

    for (const rate of exchangeRates) {
      const { error } = await supabase.from('exchange_rates').insert({
        base_currency: rate.base,
        target_currency: rate.target,
        rate: rate.rate,
        rate_type: rate.type as 'official' | 'real' | 'custom',
        effective_date: new Date().toISOString().split('T')[0],
      });

      if (error) {
        console.error('Error creating exchange rate:', error);
      }
    }

    // 3. Create Accounts
    console.log('Creating accounts...');
    const accounts = [
      {
        name: 'Cash Wallet',
        type: 'cash',
        currency: 'USD',
        balance: 200,
      },
      {
        name: 'Chase Checking',
        type: 'bank',
        currency: 'USD',
        balance: 2500,
      },
      {
        name: 'Savings Account',
        type: 'bank',
        currency: 'USD',
        balance: 5000,
      },
      {
        name: 'Galicia Visa',
        type: 'credit_card',
        currency: 'ARS',
        balance: -125000,
        credit_limit: 500000,
        closing_day: 25,
        due_day: 5,
      },
    ];

    for (const account of accounts) {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          household_id: householdId,
          name: account.name,
          type: account.type as 'cash' | 'bank' | 'credit_card' | 'crypto',
          currency: account.currency,
          balance: account.balance,
          credit_limit: account.credit_limit || null,
          closing_day: account.closing_day || null,
          due_day: account.due_day || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating account:', account.name, error);
      } else if (data) {
        accountIds[account.name] = data.id;
      }
    }

    // 4. Create Transactions
    console.log('Creating transactions...');
    const today = new Date();
    const transactions = [
      // Salary Income
      {
        account: 'Chase Checking',
        category: 'Salary',
        amount: 5000,
        currency: 'USD',
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        type: 'income',
        description: 'Monthly salary',
      },
      // Recent expenses in USD
      {
        account: 'Chase Checking',
        category: 'Groceries',
        amount: 150,
        currency: 'USD',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Whole Foods market',
      },
      {
        account: 'Cash Wallet',
        category: 'Transportation',
        amount: 25,
        currency: 'USD',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Uber ride',
      },
      // More USD expenses
      {
        account: 'Savings Account',
        category: 'Bills',
        amount: 120,
        currency: 'USD',
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Internet bill',
      },
      {
        account: 'Chase Checking',
        category: 'Restaurants',
        amount: 85,
        currency: 'USD',
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Dinner at restaurant',
      },
      {
        account: 'Cash Wallet',
        category: 'Entertainment',
        amount: 45,
        currency: 'USD',
        date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Movie tickets',
      },
      // ARS expenses
      {
        account: 'Galicia Visa',
        category: 'Groceries',
        amount: 35000,
        currency: 'ARS',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Carrefour',
      },
      {
        account: 'Galicia Visa',
        category: 'Transportation',
        amount: 8000,
        currency: 'ARS',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Cabify ride',
      },
      {
        account: 'Galicia Visa',
        category: 'Bills',
        amount: 25000,
        currency: 'ARS',
        date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        type: 'expense',
        description: 'Internet bill',
      },
    ];

    for (const transaction of transactions) {
      const { error } = await supabase.from('transactions').insert({
        household_id: householdId,
        account_id: accountIds[transaction.account],
        category_id: categoryIds[transaction.category],
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.date.toISOString().split('T')[0],
        type: transaction.type as 'income' | 'expense' | 'transfer',
        description: transaction.description,
        is_installment: false,
      });

      if (error) {
        console.error('Error creating transaction:', transaction.description, error);
      }
    }

    // 5. Create Installment Transaction (6 Cuotas on Galicia Visa)
    console.log('Creating installment transaction...');
    const installmentAmount = 60000; // Total: 60,000 ARS
    const numberOfInstallments = 6;
    const installmentPayment = new Decimal(installmentAmount).dividedBy(numberOfInstallments).toNumber();

    const { data: installmentTransaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        household_id: householdId,
        account_id: accountIds['Galicia Visa'],
        category_id: categoryIds['Shopping'],
        amount: installmentAmount,
        currency: 'ARS',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'expense',
        description: 'New laptop - 6 installments',
        is_installment: true,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating installment transaction:', txError);
    } else if (installmentTransaction) {
      // Create installment records
      console.log('Creating installment plan...');
      for (let i = 1; i <= numberOfInstallments; i++) {
        const paymentDate = new Date(today.getFullYear(), today.getMonth() + i, 25);
        const isPaid = i <= 2; // First 2 installments are paid

        const { error: installmentError } = await supabase.from('installments').insert({
          transaction_id: installmentTransaction.id,
          total_installments: numberOfInstallments,
          current_installment: i,
          installment_amount: installmentPayment,
          payment_date: paymentDate.toISOString().split('T')[0],
          is_paid: isPaid,
        });

        if (installmentError) {
          console.error('Error creating installment:', installmentError);
        }
      }
    }

    console.log('✅ Seed data created successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
}
