/*
  Create a Firebase project, enable Email/Password Authentication and
  Firestore, then replace these values with the Firebase web app config.
  Add your deployed site domain under Authentication > Settings > Authorized domains.

  In Firestore > Rules, use rules like these:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null &&
          request.auth.uid == userId &&
          request.resource.data.email == request.auth.token.email &&
          request.resource.data.role in ['passenger', 'driver'];
      }
      function isDriver() {
        return request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
      }
      function isPassenger() {
        return request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'passenger';
      }
      match /bookings/{bookingId} {
        allow create: if isPassenger() &&
          request.resource.data.passengerId == request.auth.uid &&
          request.resource.data.passengerName ==
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.name &&
          request.resource.data.status == 'Waiting for driver confirmation';
        allow read: if request.auth != null &&
          (resource.data.passengerId == request.auth.uid ||
           (isDriver() &&
            (resource.data.status == 'Waiting for driver confirmation' ||
             resource.data.driverId == request.auth.uid)));
        allow update: if request.auth != null &&
          ((resource.data.passengerId == request.auth.uid &&
            resource.data.status in
              ['Waiting for driver confirmation', 'Accepted'] &&
            request.resource.data.status == 'Cancelled' &&
            request.resource.data.diff(resource.data).affectedKeys()
              .hasOnly(['status', 'updatedAt'])) ||
           (isDriver() &&
            (resource.data.status == 'Waiting for driver confirmation' ||
             (resource.data.status == 'Accepted' &&
              resource.data.driverId == request.auth.uid)) &&
            request.resource.data.status in
              ['Accepted', 'Declined', 'Completed'] &&
            request.resource.data.diff(resource.data).affectedKeys()
              .hasOnly(['status', 'driverName', 'waitingMinutes',
                        'acceptedAt', 'declinedAt', 'completedAt',
                        'driverId', 'updatedAt']) &&
            ((request.resource.data.status == 'Accepted' &&
              resource.data.status == 'Waiting for driver confirmation' &&
              request.resource.data.driverId == request.auth.uid) ||
             (request.resource.data.status == 'Declined' &&
              resource.data.status == 'Waiting for driver confirmation' &&
              request.resource.data.driverId == resource.data.driverId) ||
             (request.resource.data.status == 'Completed' &&
              resource.data.status == 'Accepted' &&
              request.resource.data.driverId == resource.data.driverId)));
      }
      match /bookings/{bookingId}/messages/{messageId} {
        function booking() {
          return get(/databases/$(database)/documents/bookings/$(bookingId)).data;
        }
        function canChat() {
          return request.auth != null &&
            booking().status in ['Accepted', 'Completed'] &&
            (booking().passengerId == request.auth.uid ||
             (isDriver() && booking().driverId == request.auth.uid));
        }
        allow read: if canChat();
        allow create: if canChat() &&
          request.resource.data.keys().hasOnly(
            ['senderId', 'senderName', 'text', 'createdAt']
          ) &&
          request.resource.data.senderId == request.auth.uid &&
          request.resource.data.senderName ==
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.name &&
          request.resource.data.text is string &&
          request.resource.data.text.size() > 0 &&
          request.resource.data.text.size() <= 1000 &&
          request.resource.data.createdAt is int;
        allow update, delete: if false;
      }
    }
  }
*/
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const firebaseConfigured = !Object.values(firebaseConfig)
  .some(value => value.startsWith("YOUR_"));

if (firebaseConfigured) {
  firebase.initializeApp(firebaseConfig);
}

window.sakayKitaFirebase = {
  configured: firebaseConfigured,
  auth: firebaseConfigured ? firebase.auth() : null,
  db: firebaseConfigured ? firebase.firestore() : null
};
