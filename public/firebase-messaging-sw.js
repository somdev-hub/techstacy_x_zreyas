// Give the service worker access to Firebase Messaging.
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize Firebase dynamically
self.addEventListener("install", async (event) => {
  try {
    const response = await fetch("/api/firebase-config");
    const firebaseConfig = await response.json();
    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log("Received background message:", payload);

      // Extract notification data
      const notificationTitle =
        payload.notification?.title || "New Notification";
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
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
});
