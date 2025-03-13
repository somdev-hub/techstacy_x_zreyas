"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationType, Events, Year } from "@prisma/client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: "white",
  scales: {
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "white",
      },
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "white",
      },
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "white",
      },
    },
  },
};

interface NotificationStats {
  overview: {
    totalNotifications: number;
    totalUnreadNotifications: number;
    notificationsToday: number;
  };
  notificationsByType: Array<{
    type: string;
    count: number;
  }>;
  notificationsOverTime: Array<{
    date: string;
    count: number;
  }>;
  topRecipients: Array<{
    userId: number;
    count: number;
    user: {
      name: string;
      email: string;
    };
  }>;
}

interface BulkMessage {
  title: string;
  message: string;
  userType: string;
  notificationType: NotificationType;
  year?: Year | "ALL";
  eventName?: Events | undefined;
}

export default function NotificationsManagement() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe] = useState("30");
  const [bulkMessage, setBulkMessage] = useState<BulkMessage>({
    title: "",
    message: "",
    userType: "ALL",
    notificationType: "GENERAL",
    year: "ALL",
    eventName: undefined,
  });
  const [isSending, setIsSending] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/super-admin/notifications/stats?days=${timeframe}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (response.status === 403) {
          router.push("/super-admin/home");
          return;
        }
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
      toast.error("Failed to fetch notification statistics");
    } finally {
      setLoading(false);
    }
  }, [timeframe, router]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      if (user.role !== "SUPERADMIN") {
        console.log(user.role);
        router.push("/super-admin/home");
        return;
      }

      // Only fetch stats if user is authenticated and authorized
      await fetchStats();
    };

    checkAuth();
  }, [timeframe, user, router, fetchStats]);

  const handleBulkSend = async () => {
    try {
      if (!bulkMessage.title || !bulkMessage.message) {
        toast.error("Title and message are required");
        return;
      }

      setIsSending(true);
      const response = await fetch("/api/super-admin/notifications/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "bulkSend",
          ...bulkMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notifications");
      }

      toast.success(
        `Successfully sent notifications to ${data.sentCount} users`
      );
      setBulkMessage({
        title: "",
        message: "",
        userType: "ALL",
        notificationType: "GENERAL",
        year: "ALL",
        eventName: undefined,
      });
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send bulk notifications"
      );
    } finally {
      setIsSending(false);
    }
  };

  const handlePurgeOld = async () => {
    try {
      const response = await fetch("/api/super-admin/notifications/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "purge",
          olderThan: 30,
          read: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Purged ${data.deletedCount} old notifications`);
      fetchStats();
    } catch (err) {
      console.error("Failed to purge notifications:", err);
      toast.error("Failed to purge old notifications");
    }
  };

  if (!user) {
    return <div></div>; // Let the useEffect handle the redirect
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Notification Management</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm hover:bg-neutral-800/70 transition-all">
              <h3 className="text-lg font-semibold mb-2">
                Total Notifications
              </h3>
              <p className="text-2xl">
                {stats?.overview.totalNotifications || 0}
              </p>
            </div>
            <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm hover:bg-neutral-800/70 transition-all">
              <h3 className="text-lg font-semibold mb-2">
                Unread Notifications
              </h3>
              <p className="text-2xl">
                {stats?.overview.totalUnreadNotifications || 0}
              </p>
            </div>
            <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm hover:bg-neutral-800/70 transition-all">
              <h3 className="text-lg font-semibold mb-2">
                Today&apos;s Notifications
              </h3>
              <p className="text-2xl">
                {stats?.overview.notificationsToday || 0}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">
                Notifications Over Time
              </h3>
              <div className="h-[300px]">
                {stats?.notificationsOverTime && (
                  <Line
                    data={{
                      labels: stats.notificationsOverTime.map((item) =>
                        new Date(item.date).toLocaleDateString()
                      ),
                      datasets: [
                        {
                          label: "Notifications",
                          data: stats.notificationsOverTime.map(
                            (item) => item.count
                          ),
                          borderColor: "rgb(75, 192, 192)",
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">
                Notifications by Type
              </h3>
              <div className="h-[300px]">
                {stats?.notificationsByType && (
                  <Doughnut
                    data={{
                      labels: stats.notificationsByType.map((item) =>
                        item.type.replace(/_/g, " ")
                      ),
                      datasets: [
                        {
                          data: stats.notificationsByType.map(
                            (item) => item.count
                          ),
                          backgroundColor: [
                            "rgb(255, 99, 132)",
                            "rgb(54, 162, 235)",
                            "rgb(255, 206, 86)",
                            "rgb(75, 192, 192)",
                          ],
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: "right" as const,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Top Recipients Table */}
          <div className="p-4 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Top Recipients</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Notifications Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.topRecipients.map((recipient) => (
                    <TableRow key={recipient.userId}>
                      <TableCell>{recipient.user.name}</TableCell>
                      <TableCell>{recipient.user.email}</TableCell>
                      <TableCell>{recipient.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <div className="p-6 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6">
              Send Bulk Notifications
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block mb-2">Title</label>
                <Input
                  type="text"
                  className="w-full bg-neutral-700"
                  value={bulkMessage.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBulkMessage((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block mb-2">Message</label>
                <textarea
                  className="w-full bg-neutral-700 rounded-md p-2 text-white"
                  rows={4}
                  value={bulkMessage.message}
                  onChange={(e) =>
                    setBulkMessage((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">User Type</label>
                  <Select
                    value={bulkMessage.userType}
                    onValueChange={(value: string) =>
                      setBulkMessage((prev) => ({

                        ...prev,
                        userType: value,
                        // Reset event selection when changing user type
                        eventName:
                          value !== "EVENT_PARTICIPANTS"
                            ? undefined
                            : prev.eventName,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="USER">Regular Users</SelectItem>
                      <SelectItem value="ADMIN">Administrators</SelectItem>
                      <SelectItem value="EVENT_PARTICIPANTS">
                        Event Participants
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Year</label>
                  <Select
                    value={bulkMessage.year}
                    onValueChange={(value: string) =>
                      setBulkMessage((prev) => ({
                        ...prev,
                        year: value as Year | "ALL",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Years</SelectItem>
                      <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                      <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
                      <SelectItem value="THIRD_YEAR">Third Year</SelectItem>
                      <SelectItem value="FOURTH_YEAR">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bulkMessage.userType === "EVENT_PARTICIPANTS" && (
                  <div className="md:col-span-2">
                    <label className="block mb-2">Event</label>
                    <Select
                      value={bulkMessage.eventName}
                      onValueChange={(value: string) =>
                        setBulkMessage((prev) => ({
                          ...prev,
                          eventName: value as Events,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Events).map((event) => (
                          <SelectItem key={event} value={event}>
                            {event.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="block mb-2">Notification Type</label>
                  <Select
                    value={bulkMessage.notificationType}
                    onValueChange={(value) =>
                      setBulkMessage((prev) => ({
                        ...prev,
                        notificationType: value as NotificationType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="EVENT_REMINDER">
                        Event Reminder
                      </SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                      <SelectItem value="RESULT_DECLARATION">
                        Result Declaration
                      </SelectItem>
                      <SelectItem value="TEAM_INVITE">Team Invite</SelectItem>
                      <SelectItem value="INVITE_ACCEPTED">
                        Invite Accepted
                      </SelectItem>
                      <SelectItem value="INVITE_REJECTED">
                        Invite Rejected
                      </SelectItem>
                      <SelectItem value="EVENT_CANCELLED">
                        Event Cancelled
                      </SelectItem>
                      <SelectItem value="POSITION_UPDATE">
                        Position Update
                      </SelectItem>
                      <SelectItem value="QUALIFICATION_UPDATE">
                        Qualification Update
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleBulkSend}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send Notifications"
                )}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="p-6 bg-neutral-800/50 rounded-lg shadow-lg border border-neutral-700 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6">Maintenance Actions</h3>
            <div className="space-y-4">
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                onClick={handlePurgeOld}
              >
                Purge Old Notifications
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
