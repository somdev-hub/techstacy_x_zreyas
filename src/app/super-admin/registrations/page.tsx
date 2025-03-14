"use client";
import React, { useState, useEffect } from "react";
import AdminUserModal from "@/components/AdminUserModal";
import { Events } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/context/UserContext";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  college: string;
  sic: string;
  year: string;
  imageUrl: string;
  role: string;
  eventParticipation?: { eventId: number; name: string }[];
  eventHeads?: { eventId: number; name: string; eventName: Events }[];
}

interface GroupedUsers {
  role: string;
  count: number;
  users: User[];
}

const Registrations = () => {
  const [usersData, setUsersData] = useState<GroupedUsers[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/group");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsersData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      // First open the modal with basic user info immediately
      setSelectedUser(user);
      setIsModalOpen(true);

      // Then fetch detailed user data
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      const userData = await response.json();

      // Update with detailed data once available
      const formattedUser = {
        id: userData.id,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        college: userData.college || "",
        sic: userData.sic || "",
        year: userData.year || "",
        imageUrl: userData.imageUrl || "",
        role: userData.role || "",
        eventParticipation: userData.eventParticipation || [],
        eventHeads: userData.eventHeads || [],
      };

      setSelectedUser(formattedUser);
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Keep the modal open even if there's an error, just with basic info
    }
  };

  const handleUserUpdate = () => {
    fetchUsers(); // Refresh the user list after an update
  };

  const UserTable = ({ users, title }: { users: User[]; title: string }) => (
    <div className="bg-neutral-800 rounded-xl shadow-md p-4  w-full overflow-fix">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[1.125rem] font-[700]">{title}</h1>
      </div>
      <div className="table-container no-visible-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-neutral-800 z-10">
            <TableRow className="border-b border-neutral-700 hover:bg-transparent">
              <TableHead className="text-left">Name</TableHead>
              <TableHead className="text-left">Email</TableHead>
              <TableHead className="text-left">Year</TableHead>
              <TableHead className="text-left">College</TableHead>
              <TableHead className="text-left">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b border-neutral-700">
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.year}</TableCell>
                <TableCell>{user.college}</TableCell>
                <TableCell>
                  <button
                    className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => handleViewUser(user)}
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="py-4 space-y-8">
      {usersData.map((group) => (
        <div key={group.role}>
          <UserTable
            users={group.users}
            title={`${group.role} (${group.count})`}
          />
        </div>
      ))}

      {isModalOpen && selectedUser && (
        <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          userInfo={{
            id: selectedUser.id,
            name: selectedUser.name || "",
            email: selectedUser.email || "",
            phone: selectedUser.phone || "",
            college: selectedUser.college || "",
            sic: selectedUser.sic || "",
            year: selectedUser.year || "",
            imageUrl: selectedUser.imageUrl || "",
            role: selectedUser.role || "",
            eventParticipation: selectedUser.eventParticipation || [],
            eventHeads: selectedUser.eventHeads || [],
          }}
          onUpdate={handleUserUpdate}
          currentUserRole={user?.role}
        />
      )}
    </div>
  );
};

export default Registrations;
