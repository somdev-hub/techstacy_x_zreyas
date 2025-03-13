import React, { useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";

interface NotificationProps {
  toggleModal: () => void;
}

const Notification: React.FC<NotificationProps> = ({ toggleModal }) => {
  const { notifications, markAsRead, clearNotifications, refetchNotifications } = useNotifications();
  const [loadingStates, setLoadingStates] = useState<Record<number, { accept: boolean; reject: boolean }>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTeamInvite = async (notificationId: number, accept: boolean) => {
    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      [notificationId]: {
        accept: accept ? true : false,
        reject: accept ? false : true
      }
    }));

    try {
      const response = await fetch("/api/notifications/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          accept,
        }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process response");
      }

      try {
        // Mark notification as read after processing response
        await markAsRead(notificationId);
      } catch (markError) {
        console.error("Error marking notification as read:", markError);
        // Still show success for the team invite response, but warn about notification state
        toast.error("Team invite processed but couldn't update notification state");
        return;
      }

      toast.success(accept ? "Team invite accepted!" : "Team invite rejected");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process your response");
    } finally {
      // Clear loading state on success or error
      setLoadingStates(prev => ({
        ...prev,
        [notificationId]: { accept: false, reject: false }
      }));
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      toast.success("Notifications cleared successfully");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetchNotifications();
      toast.success("Notifications refreshed");
    } catch (error) {
      toast.error("Failed to refresh notifications");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/50">
      <div className="bg-neutral-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto no-visible-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isRefreshing ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></span>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
            <button
              onClick={handleClearNotifications}
              className="text-sm px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-md"
            >
              Clear All
            </button>
            <button
              onClick={toggleModal}
              className="text-neutral-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/200/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <p className="text-center text-neutral-400 py-4">No notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg ${
                  notification.isRead
                    ? "bg-neutral-800"
                    : "bg-neutral-800/50 border border-neutral-700"
                }`}
              >
                <h3 className="font-semibold mb-1">{notification.title}</h3>
                <p className="text-sm text-neutral-300 mb-2">
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-400 mb-2">
                  {formatDate(notification.createdAt)}
                </p>

                {notification.type === "TEAM_INVITE" &&
                  !notification.isRead && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleTeamInvite(notification.id, true)}
                        disabled={loadingStates[notification.id]?.accept || loadingStates[notification.id]?.reject}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-md text-sm flex items-center justify-center min-w-[80px]"
                      >
                        {loadingStates[notification.id]?.accept ? (
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white" />
                        ) : (
                          "Accept"
                        )}
                      </button>
                      <button
                        onClick={() => handleTeamInvite(notification.id, false)}
                        disabled={loadingStates[notification.id]?.accept || loadingStates[notification.id]?.reject}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-md text-sm flex items-center justify-center min-w-[80px]"
                      >
                        {loadingStates[notification.id]?.reject ? (
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white" />
                        ) : (
                          "Decline"
                        )}
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
