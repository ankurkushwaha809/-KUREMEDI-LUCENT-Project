"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";

const UsersPage = () => {
  const { getAllUsers, deleteUser, blockUser } = useContextApi();
  const [userData, setUserData] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUserData(res.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [getAllUsers]);

  // ✅ Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setDeletingId(id);
      await deleteUser(id);
      setUserData((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleBlock = async (id, nextBlocked) => {
    try {
      let reason = "";
      if (nextBlocked) {
        reason = window.prompt("Enter reason for blocking this user:", "") || "";
        if (!String(reason).trim()) return;
      }
      setUpdatingId(id);
      await blockUser(id, nextBlocked, reason);
      setUserData((prev) => prev.map((user) => (
        user._id === id ? { ...user, isBlocked: nextBlocked, blockReason: nextBlocked ? String(reason).trim() : "" } : user
      )));
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // ✅ Generate random avatar if not available
  const getRandomAvatar = (seed) => {
    // Dicebear avatar API — unique avatar per name
    return `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
      seed || "random"
    )}`;
  };

  return (
    <div className="p-6  w-[160%]">
      <h1 className="text-2xl font-bold mb-6">Users Management</h1>

      <Table className="rounded-lg border border-gray-200 shadow-md">
        <TableCaption>List of registered users.</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">S.NO</TableHead>
            <TableHead>Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {userData.length > 0 ? (
            userData.map((user, index) => (
              <TableRow key={user._id} className="hover:bg-gray-50">
                {/* Serial No */}
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>

                {/* Avatar */}
                <TableCell className="flex items-center justify-center">
                  <img
                    src={
                      user.avatar && user.avatar !== ""
                        ? user.avatar
                        : getRandomAvatar(user.name || user.email || user._id)
                    }
                    alt={user.name}
                    className="h-12 w-12 rounded-full border object-cover"
                  />
                </TableCell>

                {/* Name */}
                <TableCell>{user.name}</TableCell>

                {/* Email */}
                <TableCell>{user.email}</TableCell>

                {/* Phone */}
                <TableCell>{user.phone || user.mobile || "—"}</TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(user._id, !user.isBlocked)}
                      disabled={updatingId === user._id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border disabled:opacity-50 ${
                        user.isBlocked
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      }`}
                    >
                      {user.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user._id)}
                      disabled={deletingId === user._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersPage;
