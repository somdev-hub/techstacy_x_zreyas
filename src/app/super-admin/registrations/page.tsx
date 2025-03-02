"use client";
import React, { useState, useEffect } from "react";
import AdminUserModal from "@/components/AdminUserModal";

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
  eventParticipation?: { eventId: number }[];
  eventHeads?: { eventId: number }[];
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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUserUpdate = () => {
    fetchUsers(); // Refresh the user list after an update
  };

  const UserTable = ({ users, title }: { users: User[]; title: string }) => (
    <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px] w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[1.125rem] font-[700]">{title}</h1>
      </div>
      <div className="overflow-x-auto no-visible-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Year</th>
              <th className="text-left p-2">College</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-neutral-700">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.year}</td>
                <td className="p-2">{user.college}</td>
                <td className="p-2">
                  <button
                    className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => handleViewUser(user)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {selectedUser && (
        <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          userInfo={selectedUser}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default Registrations;
