import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { FlaggedData, Transaction } from '../../lib/types';

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<FlaggedData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [flaggedRes, statsRes] = await Promise.all([
        api.admin.flagged(),
        api.admin.stats()
      ]);

      if (flaggedRes.error || statsRes.error) {
        setError('Access denied — admin only');
        setTimeout(() => navigate('/upiguard/dashboard'), 2000);
      } else {
        setData(flaggedRes);
        setStats(statsRes);
      }
    } catch (err) {
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (flaggedId: string) => {
    try {
      const res = await api.admin.reviewFlagged(flaggedId);
      if (res.success) {
        // Update local state
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            flagged_transactions: prev.flagged_transactions.map(tx => 
              tx._id === flaggedId ? { ...tx, reviewed: true } : tx
            )
          };
        });
      }
    } catch (err) {
      console.error('Review failed', err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-2xl">Loading Admin Panel...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500 text-xl">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900">🛡️ UPIGUARD Admin Panel</h1>
          <Link to="/upiguard/dashboard" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Dashboard
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={stats?.total_users} />
          <StatCard title="Transactions" value={stats?.total_tx} />
          <StatCard title="Blocked" value={stats?.total_blocked} color="text-red-600" />
          <StatCard title="Block Rate" value={`${stats?.block_rate}%`} />
          <StatCard title="Unreviewed" value={stats?.unreviewed_count} color="text-orange-600" />
        </div>

        {/* AI Summary */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-bold text-purple-800">AI Fraud Analysis Summary</h2>
          </div>
          <p className="text-purple-900 leading-relaxed">{data?.ai_summary}</p>
        </div>

        {/* Flagged Transactions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Flagged Transactions</h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              Last {data?.count} items
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Loc</th>
                  <th className="px-6 py-3">Fraud %</th>
                  <th className="px-6 py-3">Explanation</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.flagged_transactions
                  .sort((a: any, b: any) => (a.reviewed === b.reviewed ? 0 : a.reviewed ? 1 : -1))
                  .map((tx: any) => (
                  <tr key={tx._id} className={`${tx.reviewed ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition`}>
                    <td className="px-6 py-4 font-bold text-gray-900">{tx.username || 'User'}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">₹{tx.amount}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{new Date(tx.timestamp || tx.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.location}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${(tx.fraud_probability || 0) > 0.8 ? 'text-red-600' : 'text-orange-600'}`}>
                        {((tx.fraud_probability || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={tx.explanation}>
                      {tx.explanation}
                    </td>
                    <td className="px-6 py-4">
                      {tx.reviewed ? (
                        <span className="text-green-600 text-xs font-bold flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          Reviewed
                        </span>
                      ) : (
                        <span className="text-orange-600 text-xs font-bold">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!tx.reviewed && (
                        <button 
                          onClick={() => handleReview(tx._id)}
                          className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-indigo-200 transition"
                        >
                          Mark Reviewed ✓
                        </button>
                      )}
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

const StatCard = ({ title, value, color = "text-gray-900" }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
    <p className={`text-2xl font-black mt-1 ${color}`}>{value ?? 0}</p>
  </div>
);

export default AdminPanel;
