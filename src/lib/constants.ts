export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
] as const;

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: 'wallet' },
  { value: 'bank', label: 'Bank Account', icon: 'building-2' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'crypto', label: 'Crypto Wallet', icon: 'bitcoin' },
] as const;

export const CATEGORY_ICONS = [
  'shopping-cart',
  'utensils',
  'car',
  'home',
  'heart-pulse',
  'plane',
  'dumbbell',
  'graduation-cap',
  'wallet',
  'briefcase',
  'gift',
  'zap',
] as const;
