export interface User {
  user_id: string;
  username: string;
  balance: number;
  is_admin: boolean;
}

export interface RiskFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface Transaction {
  _id: string;
  user_id: string;
  amount: number;
  timestamp: string;
  hour: number;
  location: number;
  blocked: boolean;
  fraud_probability: number;
  explanation?: string;
  risk_factors?: RiskFactor[];
}

export interface DashboardData {
  user: {
    _id: string;
    username: string;
    is_active: boolean;
    is_admin: boolean;
  };
  balance: number;
  transactions: Transaction[];
  ai_insight: string;
  security_tip: string;
}

export interface TransactionResult {
  status: 'success' | 'blocked';
  message: string;
  balance?: number;
  amount?: number;
  explanation?: string;
  fraud_probability: number;
  risk_factors?: RiskFactor[];
  blocked: boolean;
}

export interface FlaggedData {
  flagged_transactions: Array<{
    _id: string;
    username: string;
    amount: number;
    fraud_probability: number;
    explanation: string;
    reviewed: boolean;
  }>;
  count: number;
  ai_summary: string;
}
