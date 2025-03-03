import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get messaging instance only on client side
let messaging: any = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Initialize messaging only on client side
  messaging = getMessaging(app);
  
  // Register service worker
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service worker registered successfully:', registration);
      serviceWorkerRegistration = registration;
    })
    .catch((err) => {
      console.error('Service worker registration failed:', err);
    });
}

export async function requestNotificationPermission() {
  try {
    if (!messaging) {
      console.error('Messaging not initialized');
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    if (!serviceWorkerRegistration) {
      console.error('Service worker not registered');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration
    });

    if (!token) {
      console.error('Failed to get FCM token');
      return null;
    }

    console.log('FCM token obtained:', token);

    // Store FCM token in backend
    const response = await fetch('/api/user/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcmToken: token }),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to store FCM token:', data.error);
      throw new Error(data.error || 'Failed to store FCM token');
    }

    console.log('FCM token stored successfully:', data);
    return token;
  } catch (error) {
    console.error('Error in notification setup:', error);
    throw error;
  }
}

export function onMessageListener() {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    // Create and show notification
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'New Notification', {
        body: payload.notification?.body,
        icon: '/favicon.ico'
      });
    }
  });
}

export default app;