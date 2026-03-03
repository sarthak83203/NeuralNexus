import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { DashboardData, Transaction } from '../../lib/types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const result = await api.transactions.dashboard();
      if (result.error || result.authenticated === false) {
        navigate('/upiguard/login');
      } else {
        setData(result);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    navigate('/upiguard/login');
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-2xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {data?.username}!</h1>
            <p className="text-gray-500 text-lg">Balance: <span className="text-green-600 font-semibold">₹{data?.balance.toLocaleString()}</span></p>
          </div>
          <div className="space-x-4">
            <Link to="/upiguard/transaction" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
              Make Transaction
            </Link>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition">
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🤖</span>
              <h2 className="text-lg font-bold text-blue-800">AI Spending Insight</h2>
            </div>
            <p className="text-blue-900">{data?.ai_insight}</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🔒</span>
              <h2 className="text-lg font-bold text-yellow-800">Security Tip</h2>
            </div>
            <p className="text-yellow-900">{data?.security_tip}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Fraud Risk</th>
                  <th className="px-6 py-3">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.transactions.map((tx: Transaction) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">₹{tx.amount}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">Loc-{tx.location}</td>
                    <td className="px-6 py-4">
                      {tx.blocked ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">🚫 Blocked</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">✅ Success</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${tx.fraud_probability > 0.7 ? 'bg-red-500' : tx.fraud_probability > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${tx.fraud_probability * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{(tx.fraud_probability * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {tx.blocked ? tx.explanation : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
