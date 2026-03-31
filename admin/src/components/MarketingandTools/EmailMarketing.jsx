import React, { useState } from "react";
import { Send, Mail, Users, FileText, CheckCircle } from "lucide-react";

const EmailMarketing = () => {
  /* ================= STATE ================= */
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("All");
  const [schedule, setSchedule] = useState("");
  const [sent, setSent] = useState(false);

  /* ================= SEND HANDLER ================= */
  const handleSend = (e) => {
    e.preventDefault();

    if (!subject || !message) {
      alert("Please fill subject and message");
      return;
    }

    // Later connect with API
    console.log({ subject, message, recipients, schedule });

    setSent(true);

    setTimeout(() => {
      setSent(false);
      setSubject("");
      setMessage("");
      setSchedule("");
    }, 2000);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Email Marketing
        </h1>
        <p className="text-gray-500 mt-1">
          Create and send marketing emails
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Subscribers" value="1,250" icon={<Users size={22} />} />
        <StatCard title="Campaigns Sent" value="86" icon={<Mail size={22} />} />
        <StatCard title="Drafts" value="12" icon={<FileText size={22} />} />
        <StatCard title="Success Rate" value="92%" icon={<CheckCircle size={22} />} />
      </div>

      {/* ================= MAIN FORM ================= */}
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Create Campaign</h2>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Recipients
            </label>
            <select
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="All">All Subscribers</option>
              <option value="Customers">Customers</option>
              <option value="Leads">Leads</option>
              <option value="Inactive">Inactive Users</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your marketing message..."
              rows="6"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            ></textarea>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send size={18} />
              {schedule ? "Schedule" : "Send Now"}
            </button>
          </div>

          {/* Success Message */}
          {sent && (
            <p className="text-green-600 text-sm font-medium">
              ✅ Campaign sent successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmailMarketing;

/* ================= STAT CARD ================= */

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold mt-1">{value}</h2>
      </div>

      <div className="text-blue-600">{icon}</div>
    </div>
  );
};
