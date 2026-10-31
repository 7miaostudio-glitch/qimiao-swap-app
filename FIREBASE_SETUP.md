# Firebase setup

1. Create a Firebase project and register a Web app.
2. In **Authentication → Sign-in method**, enable **Google**. Anonymous sign-in is optional and not required by the current app. Set the project support email for Google sign-in if prompted.
3. Create a **Cloud Firestore** database.
4. Copy the Firebase Web app configuration into `js/firebase.js` (`firebaseConfig`).
5. Publish `firestore.rules` in **Firestore Database → Rules**.
6. Serve this folder from a local web server or deploy it to Firebase Hosting. ES module imports will not run when opening `index.html` as a `file://` URL.

The CSS and JavaScript URLs in `index.html` include a version query to avoid stale browser caches. When deploying later frontend changes, increment the `v=` value on those asset URLs and redeploy `index.html` together with the app files. If an already-open page still shows the previous version, do one hard refresh.

After setup, each Google-authenticated Firebase user has a private document at `users/{uid}/appData/main`. Existing browser data is uploaded on the first connection. Future saves update Firestore and keep a local cache. On a device holding existing data, first sign in or link Google so the app uploads the local data. On other devices, sign into the same Google account to load the same private Firestore document. Keep the Firestore rules restricted to the signed-in UID.
