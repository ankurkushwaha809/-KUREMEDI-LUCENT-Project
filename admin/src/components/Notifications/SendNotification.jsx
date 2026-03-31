import React, { useState } from "react";

export default function SendNotification() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipient: "All Users",
  });

  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    // Simulate API call
    setTimeout(() => {
      alert(`Notification sent to ${formData.recipient}`);
      setFormData({ title: "", message: "", recipient: "All Users" });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
        <p className="text-gray-500 mt-1">
          Send notifications to users, agents, or retailers
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Recipient</label>
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option>All Users</option>
              <option>Agents</option>
              <option>Retailers</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter your message"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
}
