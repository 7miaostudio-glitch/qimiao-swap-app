// Paste the Web app configuration from Firebase Console > Project settings > Your apps.
const firebaseConfig = {
  apiKey: "AIzaSyDBZNV_6Zrv85l9vWN9VaFinNsgxHMWYsc",
  authDomain: "qimiaoswap.firebaseapp.com",
  projectId: "qimiaoswap",
  appId: "1:921030901613:web:e6e103183af6f8311e2464",
};

const status = document.getElementById('syncStatus');
const configured = firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' && firebaseConfig.appId !== 'YOUR_APP_ID';

if (!configured) {
  status.textContent = '尚未配置 Firebase：请编辑 app.js 填入 Firebase Web 配置。当前数据保存在本机。';
} else {
  try {
    const [appSdk, authSdk, dbSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);
    const firestore = dbSdk.getFirestore(app);
    const credential = await authSdk.signInAnonymously(auth);
    const dataRef = dbSdk.doc(firestore, 'users', credential.user.uid, 'appData', 'main');

    window.firebaseStore = {
      async save(data) {
        status.textContent = '正在同步到 Firebase…';
        await dbSdk.setDoc(dataRef, { stocks: data.stocks, trades: data.trades, updatedAt: dbSdk.serverTimestamp() });
        status.textContent = '已同步到 Firebase';
      }
    };

    const snapshot = await dbSdk.getDoc(dataRef);
    if (snapshot.exists()) {
      const remote = snapshot.data();
      if (Array.isArray(remote.stocks) && Array.isArray(remote.trades)) {
        window.setAppDb({ stocks: remote.stocks, trades: remote.trades });
        localStorage.setItem('qimiao_swap_v1', JSON.stringify(window.getAppDb()));
      }
    } else {
      // First login: upload this browser's existing local data.
      await window.firebaseStore.save(window.getAppDb());
    }
    window.render();
    status.textContent = '已连接 Firebase 并同步';
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    const detail = error?.code || error?.message || '未知错误';
    status.textContent = `Firebase 连接失败（${detail}）；数据仍保存在本机。`; 
  }
}
