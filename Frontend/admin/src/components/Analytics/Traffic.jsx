import React, { useState } from 'react';

export default function TariffReport() {
  // Sample data
  const [tariffs, setTariffs] = useState([
    { id: 1, customer: 'John Doe', plan: 'Basic', usage: 120, amount: 300 },
    { id: 2, customer: 'Jane Smith', plan: 'Premium', usage: 450, amount: 1200 },
    { id: 3, customer: 'Alice Johnson', plan: 'Standard', usage: 250, amount: 600 },
  ]);

  const [search, setSearch] = useState('');

  const filteredTariffs = tariffs.filter(
    (t) =>
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.plan.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate total amount
  const totalAmount = filteredTariffs.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Tariff Report</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer or plan"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Summary Card */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-1/3">
          <h2 className="text-xl font-semibold">Total Amount</h2>
          <p className="text-2xl font-bold text-green-600">₹ {totalAmount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="bg-blue-500 text-white text-left">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Usage (Units)</th>
              <th className="py-3 px-4">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredTariffs.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{t.customer}</td>
                <td className="py-3 px-4">{t.plan}</td>
                <td className="py-3 px-4">{t.usage}</td>
                <td className="py-3 px-4">{t.amount}</td>
              </tr>
            ))}
            {filteredTariffs.length === 0 && (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
