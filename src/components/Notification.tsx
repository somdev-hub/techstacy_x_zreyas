import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from "sonner";

interface NotificationProps {
  toggleModal: () => void;
}

const Notification: React.FC<NotificationProps> = ({ toggleModal }) => {
  const { notifications, markAsRead } = useNotifications();

  const handleTeamInvite = async (notificationId: number, accept: boolean) => {
    try {
      const response = await fetch('/api/notifications/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          accept
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to process response');
      }

      // Mark notification as read after processing response
      await markAsRead(notificationId);
      
      toast.success(accept ? 'Team invite accepted!' : 'Team invite rejected');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process your response');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/50">
      <div className="bg-neutral-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button onClick={toggleModal} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-center text-neutral-400 py-4">No notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg ${notification.isRead ? 'bg-neutral-800' : 'bg-neutral-800/50 border border-neutral-700'}`}
              >
                <h3 className="font-semibold mb-1">{notification.title}</h3>
                <p className="text-sm text-neutral-300 mb-2">{notification.message}</p>
                <p className="text-xs text-neutral-400 mb-2">{formatDate(notification.createdAt)}</p>
                
                {notification.type === 'TEAM_INVITE' && !notification.isRead && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleTeamInvite(notification.id, true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleTeamInvite(notification.id, false)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                    >
                      Decline
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
