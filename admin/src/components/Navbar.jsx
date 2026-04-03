import React from "react";
import {
    Search,
    Folder,
    Calendar,
    MessageCircle,
    Mail,
    Bell,
    SlidersHorizontal,
    LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ className = "" }) => {
    // const adminUser = JSON.parse(localStorage.getItem("adminUser"));
    const loggedInSalesName = "KUREMEDI LUCENT bio";
    const loggedInRole = "Admin";
    console.log("name", loggedInSalesName)
    console.log("admin", loggedInRole)
    const navigate = useNavigate();
const handleLogout=()=>{
    localStorage.clear();
    navigate("/login"); 
    
}

    return (
        <nav
            className={`fixed top-0 left-0 w-full bg-[ghostwhite]  shadow-sm z-50 ${className}`}
        >
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Left Section - Logo */}
                <div className="flex items-center space-x-2">
                    {/* Stylized Logo */}
                    <div className="flex items-center justify-center bg-gray-800 rounded w-8 h-8">
                        <div className="w-4 h-4 border-2 border-white border-r-0 border-b-0 rotate-45"></div>
                    </div>
                    <span className="text-gray-900 text-lg font-semibold tracking-wide">
                        {loggedInSalesName}
                    </span>
                </div>

                {/* Center Section - Search Bar */}
                <div className="hidden sm:flex flex-grow justify-center max-w-sm mx-4 relative">
                    <input
                        type="text"
                        placeholder="Search here..."
                        className="w-full py-2 pl-4 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                {/* Right Section - Icons */}
                <div className="flex items-center gap-4">
                    <button className="text-gray-600 hover:text-gray-900 transition">
                        <Folder className="w-5 h-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 transition">
                        <Calendar className="w-5 h-5" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 transition">
                        <MessageCircle className="w-5 h-5" />
                    </button>

                    {/* Mail Icon with notification dot */}
                    <button className="relative text-gray-600 hover:text-gray-900 transition">
                        <Mail className="w-5 h-5" />
                        <span className="absolute top-0 right-0 block w-2 h-2 bg-rose-500 border-2 border-[floralwhite] rounded-full"></span>
                    </button>

                    {/* Bell Icon with notification dot */}
                    <button className="relative text-gray-600 hover:text-gray-900 transition">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0 right-0 block w-2 h-2 bg-emerald-500 border-2 border-[floralwhite] rounded-full"></span>
                    </button>

                    <button className="text-gray-600 hover:text-gray-900 transition">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>

                    <button className="text-gray-600 hover:text-red-600 transition">
                        <LogOut className="w-5 h-5" onClick={handleLogout} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
