# Firebase setup

1. Create a Firebase project and register a Web app.
2. In **Authentication → Sign-in method**, enable **Anonymous** and **Google**. Set the project support email for Google sign-in if prompted.
3. Create a **Cloud Firestore** database.
4. Copy the Firebase Web app configuration into `app.js` (`firebaseConfig`).
5. Publish `firestore.rules` in **Firestore Database → Rules**.
6. Serve this folder from a local web server or deploy it to Firebase Hosting. ES module imports will not run when opening `index.html` as a `file://` URL.

After setup, each Firebase user has a private document at `users/{uid}/appData/main`. Existing browser data is uploaded on the first connection. Future saves update Firestore and keep a local cache. Click **绑定 Google 账号，跨设备同步** on the device holding your existing data to link that anonymous account and preserve its UID. On other devices, open the app and use the same Google account; the app loads the same private Firestore document. Keep the Firestore rules restricted to the signed-in UID.
