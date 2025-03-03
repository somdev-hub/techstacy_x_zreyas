// Give the service worker access to Firebase Messaging.
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize Firebase with hardcoded config
firebase.initializeApp({
  apiKey: "AIzaSyA-X4trZSK8Yi3vlSIr1Uxm-S-W2xFgwkM",
  authDomain: "techstacy-x-zreyas.firebaseapp.com",
  projectId: "techstacy-x-zreyas",
  storageBucket: "techstacy-x-zreyas.firebasestorage.app",
  messagingSenderId: "960042894300",
  appId: "1:960042894300:web:7f90cb7d8ace8681a44519",
  vapidKey: "BHyNJQGVpGd3sWgq6tyjKiH3UMFNc9NPPzaE-ZZYPnV0wUT6V2BWfVStX0xoBSGVHpLukiucCFXG7HMU7-jf8qU"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.tag || "default",
    data: payload.data,
  };

  // Show notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
