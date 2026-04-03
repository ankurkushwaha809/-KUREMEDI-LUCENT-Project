import React, { useCallback, useEffect, useState } from "react";
import { useContextApi } from "../../hooks/useContextApi";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Phone,
  PhoneOff,
  Loader2,
  X,
  Send,
  StickyNote,
} from "lucide-react";
import { Device } from "@twilio/voice-sdk";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "NEW", label: "New" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "CALLING", label: "Calling" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

const STATUS_OPTIONS = ["NEW", "OPEN", "IN_PROGRESS", "CALLING", "RESOLVED", "CLOSED"];

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
  </div>
);

const AllTickets = ({ initialTab = "" } = {}) => {
  const {
    getSupportTickets,
    getSupportTicketById,
    replySupportTicket,
    updateSupportTicketStatus,
    addSupportCallNote,
    updateSupportTicketNotes,
    initiateSupportCall,
  } = useContextApi();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [callNoteText, setCallNoteText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [calling, setCalling] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [twilioDevice, setTwilioDevice] = useState(null);
  const [callError, setCallError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSupportTickets(
        activeTab ? { status: activeTab } : {}
      );
      const data = res?.data ?? [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getSupportTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time: poll messages when a ticket is open so new retailer/MR messages appear
  useEffect(() => {
    if (!selectedTicket?._id) return;
    const interval = setInterval(() => {
      getSupportTicketById(selectedTicket._id)
        .then((res) => {
          const next = res?.data ?? null;
          if (next) setDetail(next);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedTicket?._id, getSupportTicketById]);

  const openDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setDetail(null);
    setReplyText("");
    setCallNoteText("");
    setInternalNotes(ticket?.adminNotes ?? "");
    setLoadingDetail(true);
    try {
      const res = await getSupportTicketById(ticket._id);
      setDetail(res?.data ?? null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load ticket");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReply = async () => {
    const body = replyText.trim();
    if (!body || !selectedTicket) return;
    setSending(true);
    try {
      await replySupportTicket(selectedTicket._id, body);
      const res = await getSupportTicketById(selectedTicket._id);
      setDetail(res?.data ?? null);
      setReplyText("");
      fetchTickets();
      toast.success("Reply sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await updateSupportTicketStatus(selectedTicket._id, newStatus);
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      if (detail) setDetail((d) => (d ? { ...d, ticket: { ...d.ticket, status: newStatus } } : null));
      fetchTickets();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCallNote = async () => {
    if (!selectedTicket) return;
    setSending(true);
    try {
      await addSupportCallNote(selectedTicket._id, callNoteText.trim() || undefined);
      const res = await getSupportTicketById(selectedTicket._id);
      setDetail(res?.data ?? null);
      setCallNoteText("");
      fetchTickets();
      toast.success("Call note added");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add call note");
    } finally {
      setSending(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    try {
      await updateSupportTicketNotes(selectedTicket._id, internalNotes);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save notes");
    }
  };

  const stats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === "NEW").length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    calling: tickets.filter((t) => t.status === "CALLING").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const handleCallClick = async () => {
    if (!selectedTicket) return;
    setCalling(true);
    setCallError(null);
    try {
      const res = await initiateSupportCall(selectedTicket._id);
      const { accessToken, conferenceName } = res?.data ?? {};
      if (!accessToken || !conferenceName) {
        toast.error("Could not start call");
        return;
      }
      const device = new Device(accessToken, { logLevel: 0 });
      device.on("registered", () => {
        device.connect({ params: { To: conferenceName } }).then((call) => {
          setActiveCall(call);
          setTwilioDevice(device);
          toast.success("Connected – customer is being called");
          call.on("disconnect", () => {
            setActiveCall(null);
            setTwilioDevice(null);
            addSupportCallNote(selectedTicket._id, "Call ended.").catch(() => {});
            getSupportTicketById(selectedTicket._id).then((r) => setDetail(r?.data ?? null));
            fetchTickets();
          });
        }).catch((err) => {
          setCallError(err?.message || "Failed to connect");
          toast.error(err?.message || "Failed to connect to call");
        });
      });
      device.on("error", (err) => {
        setCallError(err?.message);
        toast.error(err?.message || "Device error");
        setCalling(false);
      });
      device.register();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to initiate call";
      toast.error(msg);
      setCallError(msg);
    } finally {
      setCalling(false);
    }
  };

  const handleHangUp = () => {
    if (activeCall) {
      activeCall.disconnect();
      setActiveCall(null);
    }
    if (twilioDevice) {
      twilioDevice.destroy();
      setTwilioDevice(null);
    }
  };

  const ticketUser = (t) => {
    const u = t.user;
    const name = t.contactName || (u && typeof u === "object" ? u.name : null) || "-";
    const phone = t.contactPhone || (u && typeof u === "object" ? u.phone : null) || "-";
    const email = t.contactEmail || (u && typeof u === "object" ? u.email : null) || "-";
    return { name, phone, email };
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Support & Tickets</h1>
        <p className="text-gray-500">Manage customer support (inbound & outbound)</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key || "all"}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key
                ? "bg-teal-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            {tab.label}{" "}
            {tab.key === "" && `(${stats.total})`}
            {tab.key === "NEW" && `(${stats.new})`}
            {tab.key === "OPEN" && `(${stats.open})`}
            {tab.key === "IN_PROGRESS" && `(${stats.inProgress})`}
            {tab.key === "CALLING" && `(${stats.calling})`}
            {tab.key === "RESOLVED" && `(${stats.resolved})`}
            {tab.key === "CLOSED" && `(${stats.closed})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tickets" value={stats.total} />
        <StatCard title="New / Open" value={stats.new + stats.open} />
        <StatCard title="In Progress / Calling" value={stats.inProgress + stats.calling} />
        <StatCard title="Resolved / Closed" value={stats.resolved + stats.closed} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tickets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">Ticket #</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9" className="text-center py-10">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-teal-600" />
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-500">
                    No tickets found
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((ticket) => {
                  const u = ticketUser(ticket);
                  return (
                    <tr
                      key={ticket._id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 font-mono text-sm text-gray-700">#{ticket.ticketNo || ticket._id?.slice(-6)}</td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {ticket.subject}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.phone}</td>
                      <td className="p-3 text-gray-600 text-xs max-w-[120px] truncate" title={u.email}>{u.email}</td>
                      <td className="p-3">{ticket.category}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${ticket.status === "NEW"
                              ? "bg-violet-100 text-violet-800"
                              : ticket.status === "OPEN"
                                ? "bg-amber-100 text-amber-800"
                                : ticket.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : ticket.status === "CALLING"
                                    ? "bg-orange-100 text-orange-800"
                                    : ticket.status === "RESOLVED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => openDetail(ticket)}
                          className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          View / Reply
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="text-xs text-gray-500 font-mono">#{selectedTicket.ticketNo || selectedTicket._id?.slice(-6)}</p>
                <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setDetail(null);
                  handleHangUp();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Customer & call info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">Customer & contact</p>
                <p>
                  <span className="text-gray-600">Name:</span>{" "}
                  {detail?.ticket?.contactName || ticketUser(selectedTicket).name}
                </p>
                <p>
                  <span className="text-gray-600">Phone:</span>{" "}
                  <a
                    href={`tel:${detail?.ticket?.contactPhone || ticketUser(selectedTicket).phone}`}
                    className="text-teal-600 hover:underline"
                  >
                    {detail?.ticket?.contactPhone || ticketUser(selectedTicket).phone}
                  </a>
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>{" "}
                  <a
                    href={`mailto:${detail?.ticket?.contactEmail || ticketUser(selectedTicket).email}`}
                    className="text-teal-600 hover:underline"
                  >
                    {detail?.ticket?.contactEmail || ticketUser(selectedTicket).email}
                  </a>
                </p>
                <p>
                  <span className="text-gray-600">Category:</span> {selectedTicket.category} ·{" "}
                  <span className="text-gray-600">Priority:</span> {selectedTicket.priority}
                </p>
              </div>

              {/* Call customer via Twilio */}
              {selectedTicket.status !== "CLOSED" && (
                <div className="flex items-center gap-2 flex-wrap">
                  {!activeCall ? (
                    <button
                      onClick={handleCallClick}
                      disabled={calling}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50"
                    >
                      {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                      {calling ? "Connecting…" : "Call customer"}
                    </button>
                  ) : (
                    <button
                      onClick={handleHangUp}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                    >
                      <PhoneOff className="h-4 w-4" />
                      End call
                    </button>
                  )}
                  {callError && <span className="text-sm text-red-600">{callError}</span>}
                </div>
              )}

              {/* Close ticket (Resolved → Closed) */}
              {selectedTicket.status !== "CLOSED" && (
                <div>
                  <button
                    onClick={() => handleStatusChange("CLOSED")}
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                    Close ticket
                  </button>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {/* Admin notes (internal) */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Internal notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Private notes (not visible to customer)"
                  className="w-full border rounded-lg p-2 text-sm min-h-[60px]"
                  rows={2}
                />
              </div>

              {/* Chat / messages */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Conversation</p>
                {loadingDetail ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {/* Initial message */}
                    {detail?.ticket && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
                          <p className="text-sm text-gray-800">{detail.ticket.initialMessage}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(detail.ticket.createdAt)} · Customer
                          </p>
                        </div>
                      </div>
                    )}
                    {detail?.messages?.map((m) => (
                      <div
                        key={m._id}
                        className={`flex ${m.isFromAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 max-w-[85%] ${m.isFromAdmin
                              ? "bg-teal-600 text-white rounded-tr-none"
                              : "bg-gray-200 rounded-tl-none"
                            } ${m.type === "call_note" ? "border border-dashed border-teal-400" : ""}`}
                        >
                          {m.type === "call_note" && (
                            <p className="text-xs font-medium opacity-90 mb-1">📞 Call note</p>
                          )}
                          <p className="text-sm">{m.body}</p>
                          <p className={`text-xs mt-1 ${m.isFromAdmin ? "text-teal-200" : "text-gray-500"}`}>
                            {formatDate(m.createdAt)} · {m.isFromAdmin ? "Support" : "Customer"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Reply
                  </button>
                </div>
              </div>

              {/* Call note (outbound) */}
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Log outbound call
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={callNoteText}
                    onChange={(e) => setCallNoteText(e.target.value)}
                    placeholder="Call note (optional)"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCallNote}
                    disabled={sending}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
                    Add call note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTickets;
