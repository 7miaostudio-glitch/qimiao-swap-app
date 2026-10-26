# Firebase setup

1. Create a Firebase project and register a Web app.
2. In **Authentication → Sign-in method**, enable **Anonymous**.
3. Create a **Cloud Firestore** database.
4. Copy the Firebase Web app configuration into `app.js` (`firebaseConfig`).
5. Publish `firestore.rules` in **Firestore Database → Rules**.
6. Serve this folder from a local web server or deploy it to Firebase Hosting. ES module imports will not run when opening `index.html` as a `file://` URL.

After setup, each anonymous Firebase user has a private document at `users/{uid}/appData/main`. Existing browser data is uploaded on the first connection. Future saves update Firestore and keep a local cache. The app currently has no account recovery or cross-device identity: anonymous users are tied to their browser's Firebase auth state, so add a permanent sign-in method before relying on cross-device access.
