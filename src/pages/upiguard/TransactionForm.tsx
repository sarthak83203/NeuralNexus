import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { TransactionResult } from '../../lib/types';

const TransactionForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.transactions.create(Number(amount), Number(location));
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Transaction failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            UPI Payment
          </h2>
        </div>

        {!result ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10000000"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location (0-4)</label>
                <select
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="0">Location 0 (Home)</option>
                  <option value="1">Location 1 (Work)</option>
                  <option value="2">Location 2 (Market)</option>
                  <option value="3">Location 3 (Other City)</option>
                  <option value="4">Location 4 (Unknown)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
            
            <div className="text-center">
              <Link to="/upiguard/dashboard" className="text-sm text-gray-600 hover:text-indigo-500">
                Back to Dashboard
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {result.status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                <div className="text-4xl text-green-500">✅</div>
                <h3 className="text-xl font-bold text-green-800">Transaction Successful</h3>
                <p className="text-green-700">{result.message}</p>
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-500">New Balance</p>
                  <p className="text-2xl font-bold text-green-600">₹{result.balance?.toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-400">Fraud risk was: {(result.fraud_probability * 100).toFixed(1)}%</p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
                <div className="text-4xl text-center text-red-500">🚨</div>
                <h3 className="text-xl font-bold text-red-800 text-center">Transaction Blocked</h3>
                <div className="bg-white p-4 rounded-lg border border-red-100 text-sm italic text-gray-700">
                  {result.explanation}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.risk_factors?.map((rf, i) => (
                      <span key={i} className={`px-2 py-1 rounded-full text-xs font-bold ${rf.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {rf.factor}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-center text-gray-400">Fraud probability: {(result.fraud_probability * 100).toFixed(1)}%</p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => setResult(null)} 
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                New Transaction
              </button>
              <Link to="/upiguard/dashboard" className="text-center text-indigo-600 hover:text-indigo-500 font-medium">
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
