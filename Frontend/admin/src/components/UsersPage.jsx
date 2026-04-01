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
import { Pencil, Trash2, Eye } from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";
import { Button } from "@/components/ui/button";

const UsersPage = () => {
  const { getAllUsers, deleteUser } = useContextApi();
  const [userData, setUserData] = useState([]);

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUserData(res.data || []); // Adjust to match your API structure
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
      await deleteUser(id);
      setUserData((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
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
            <TableHead className="text-center">View</TableHead>
            <TableHead className="text-center">Edit</TableHead>
            <TableHead className="text-center">Delete</TableHead>
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
                <TableCell>{user.mobile || "—"}</TableCell>

                {/* View */}
                <TableCell className="text-center">
                  <button className="rounded-md p-2 hover:bg-green-100 transition">
                    <Eye className="h-5 w-5 text-green-600" />
                  </button>
                </TableCell>

                {/* Edit */}
                <TableCell className="text-center">
                  <button className="rounded-md p-2 hover:bg-blue-100 transition">
                    <Pencil className="h-5 w-5 text-blue-600" />
                  </button>
                </TableCell>

                {/* Delete */}
                <TableCell className="text-center">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="rounded-md p-2 hover:bg-red-100 transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-gray-500">
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
