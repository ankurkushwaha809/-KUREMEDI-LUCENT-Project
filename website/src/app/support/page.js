'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Plus, List, Send, ChevronLeft, Headset, X } from 'lucide-react';
import { useAppContext } from "@/context/context"; // Fixed path

const Support = () => {
    // 1. Get real data and functions from Context
    const {
        supportTickets, activeTicket, messages, supportLoading,
        fetchSupportTickets, loadTicketChat, sendSupportMsg,
        setActiveTicket, setMessages, user
    } = useAppContext();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [input, setInput] = useState("");
    const [formDetails, setFormDetails] = useState({
        name: "",
        phone: "",
        email: "",
        problemType: "OTHER",
    });
    const scrollRef = useRef(null);

    // Prefill from user when available
    useEffect(() => {
        if (user) {
            setFormDetails((prev) => ({
                ...prev,
                name: user.name || prev.name,
                phone: user.phone || prev.phone,
                email: user.email || prev.email,
            }));
        }
    }, [user?.name, user?.phone, user?.email]);

    // 2. Fetch history on load
    useEffect(() => {
        fetchSupportTickets();
    }, [fetchSupportTickets]);

    // 3. Auto-scroll to bottom when new messages arrive
    // useEffect(() => {
    //     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [messages]);

    const problemTypes = [
        { label: 'Order status', value: 'ORDER' },
        { label: 'Payment issue', value: 'PAYMENT' },
        { label: 'Product enquiry', value: 'PRODUCT' },
        { label: 'Wallet / Balance', value: 'WALLET' },
        { label: 'KYC / Verification', value: 'KYC' },
        { label: 'Delivery issue', value: 'DELIVERY' },
        { label: 'Something else', value: 'OTHER' },
    ];

    // const handleSend = async (textOverride) => {
    //     const body = textOverride || input;
    //     if (!body.trim()) return;

    //     setInput(""); // Clear immediately for snappy UI
    //     try {
    //         await sendSupportMsg(body);
    //     } catch (err) {
    //         console.error("Failed to send", err);
    //     }
    // };

    const handleSend = async (textOverride, categoryOverride = null) => {
        const body = textOverride || input;
        if (!body.trim()) return;

        const problemType = categoryOverride ?? formDetails.problemType;
        setInput("");
        try {
            await sendSupportMsg(body, problemType, {
                contactName: formDetails.name || undefined,
                contactPhone: formDetails.phone || undefined,
                contactEmail: formDetails.email || undefined,
                problemType,
            });
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        const body = input.trim();
        if (!body) return;
        handleSend(body, formDetails.problemType);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans relative overflow-hidden">

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-30">
                <div className="flex items-center gap-4">
                    <ChevronLeft className="w-6 h-6 text-gray-700 cursor-pointer" onClick={() => window.history.back()} />
                    <h1 className="text-xl font-semibold text-gray-800">Support Chat</h1>
                </div>

                <div
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-teal-600 rounded-full text-white cursor-pointer md:hidden active:scale-95 transition-transform"
                >
                    <List className="w-5 h-5" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[50] md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar: Using supportTickets from Context */}
                <aside className={`
                    fixed md:relative top-0 left-0 inset-y-0 z-[60] md:z-auto
                    h-full w-[85%] md:w-96 
                    bg-white border-r border-gray-200 flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="flex items-center justify-between p-5 md:hidden border-b bg-gray-50">
                        <span className="font-bold text-gray-800">Recent Chats</span>
                        <X className="w-6 h-6 text-gray-400" onClick={() => setIsSidebarOpen(false)} />
                    </div>

                    <div className="p-4">
                        <button
                            onClick={() => { setActiveTicket(null); setMessages([]); setIsSidebarOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#0d9488] hover:bg-[#0a7a70] text-white py-3 rounded-xl font-medium shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> New conversation
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
                        {supportTickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                onClick={() => { loadTicketChat(ticket._id); setIsSidebarOpen(false); }}
                                className={`p-4 border rounded-xl cursor-pointer transition-all ${activeTicket?._id === ticket._id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-100 bg-white hover:border-teal-200'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 text-[15px] line-clamp-1">{ticket.subject || ticket.initialMessage}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm truncate">{ticket.initialMessage}</p>
                                <div className="text-gray-400 text-[11px] mt-2 uppercase font-medium">
                                    {ticket.category}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col bg-[#f4f7f9] z-10">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* 1. Welcome Bubble (Shown if no active ticket) */}
                        {!activeTicket && (
                            <div className="flex items-start gap-3 max-w-2xl">
                                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100 shrink-0">
                                    <Headset className="w-6 h-6 text-teal-600" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                    <p className="font-bold text-gray-800 mb-1">Support</p>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                        Hi! How can we help you today? Type your question below or choose a topic. Our team will reply here and may call you if needed.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. Problem form & topic shortcuts (Shown if no active ticket) */}
                        {!activeTicket && (
                            <div className="md:pl-12 space-y-4 max-w-xl">
                                <form onSubmit={handleSubmitForm} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                    <p className="text-gray-700 font-medium text-sm">Submit your problem (name, phone, email help us contact you)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={formDetails.name}
                                            onChange={(e) => setFormDetails((p) => ({ ...p, name: e.target.value }))}
                                            className="border rounded-lg px-3 py-2 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Phone"
                                            value={formDetails.phone}
                                            onChange={(e) => setFormDetails((p) => ({ ...p, phone: e.target.value }))}
                                            className="border rounded-lg px-3 py-2 text-sm"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={formDetails.email}
                                            onChange={(e) => setFormDetails((p) => ({ ...p, email: e.target.value }))}
                                            className="border rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-600 text-xs block mb-1">Problem type</label>
                                        <select
                                            value={formDetails.problemType}
                                            onChange={(e) => setFormDetails((p) => ({ ...p, problemType: e.target.value }))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        >
                                            {problemTypes.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-600 text-xs block mb-1">Message</label>
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Describe your problem..."
                                            rows={3}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="px-4 py-2 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0a7a70] disabled:opacity-50"
                                        >
                                            Submit problem
                                        </button>
                                        <span className="text-gray-500 text-xs self-center">or pick a topic below to send quickly</span>
                                    </div>
                                </form>
                                <div>
                                    <p className="text-gray-500 text-sm mb-2">Quick topic:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {problemTypes.map((t) => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => handleSend(t.label, t.value)}
                                                className="px-4 py-2 bg-white border border-teal-100 text-teal-700 rounded-full text-xs md:text-sm font-medium hover:bg-teal-50 hover:border-teal-400 shadow-sm transition-all"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Real Messages from Context */}
                        {activeTicket && messages.map((m) => (
                            <div key={m._id} className={`flex ${m.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${m.isFromAdmin
                                    ? 'bg-white rounded-tl-none border border-gray-100 text-gray-800'
                                    : 'bg-[#0d9488] rounded-tr-none text-white'
                                    } ${m.type === 'call_note' ? 'border-2 border-dashed border-teal-300' : ''}`}>
                                    {m.type === 'call_note' && <p className="text-[10px] font-bold uppercase mb-1 opacity-70">Call Note</p>}
                                    <p className="text-sm md:text-base">{m.body}</p>
                                    <p className={`text-[10px] mt-1 opacity-60 text-right`}>
                                        {m.isFromAdmin ? 'Support' : 'You'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} /> {/* Scroll Anchor */}
                    </div>

                    {/* Input Footer */}
                    {(!activeTicket || activeTicket.status !== 'CLOSED') && activeTicket ? (
                        <div className="p-4 bg-white md:bg-transparent md:px-12 md:pb-8">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative max-w-4xl mx-auto flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full py-3 md:py-4 px-6 rounded-full border border-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-3 bg-[#0d9488] text-white rounded-full shadow-lg hover:bg-[#0a7a70] disabled:bg-gray-300 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-100 text-center text-gray-500 font-medium">
                            This conversation is closed. Start a new one to continue.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Support;