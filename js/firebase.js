// Paste the Web app configuration from Firebase Console > Project settings > Your apps.
const firebaseConfig = {
  apiKey: "AIzaSyDBZNV_6Zrv85l9vWN9VaFinNsgxHMWYsc",
  authDomain: "qimiaoswap.firebaseapp.com",
  projectId: "qimiaoswap",
  appId: "1:921030901613:web:e6e103183af6f8311e2464",
};

const status = document.getElementById('syncStatus');
const connectButton = document.getElementById('connectGoogle');
const configured = firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' && firebaseConfig.appId !== 'YOUR_APP_ID';

if (!configured) {
  status.textContent = '尚未配置 Firebase：请编辑 app.js 填入 Firebase 配置。当前数据保存在本机。';
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
    const googleProvider = new authSdk.GoogleAuthProvider();
    let dataRef;

    async function saveData(data) {
      if (!dataRef) {
        status.textContent = '本机缓存已保存；登录 Google 账号后即可同步到其他设备。';
        return;
      }
      status.textContent = '正在同步到 Firebase…';
      await dbSdk.setDoc(dataRef, {
        stocks: data.stocks,
        trades: data.trades,
        orders: data.orders || [],
        updatedAt: dbSdk.serverTimestamp(),
      });
      status.textContent = '已同步到 Firebase';
    }

    async function loadUserData(user) {
      dataRef = dbSdk.doc(firestore, 'users', user.uid, 'appData', 'main');
      const snapshot = await dbSdk.getDoc(dataRef);
      if (snapshot.exists()) {
        const remote = snapshot.data();
        if (Array.isArray(remote.stocks) && Array.isArray(remote.trades)) {
          window.setAppDb({ stocks: remote.stocks, trades: remote.trades, orders: Array.isArray(remote.orders) ? remote.orders : [] });
          localStorage.setItem('qimiao_swap_v1', JSON.stringify(window.getAppDb()));
        }
      } else {
        // First login for this account: upload this browser's current local data.
        await saveData(window.getAppDb());
      }
      window.render();
    }

    window.firebaseStore = { save: saveData };
    window.connectGoogle = async function () {
      connectButton.disabled = true;
      status.textContent = '正在连接 Google 账号…';
      try {
        let user;
        if (auth.currentUser?.isAnonymous) {
          try {
            const linked = await authSdk.linkWithPopup(auth.currentUser, googleProvider);
            user = linked.user;
          } catch (error) {
            // If this Google account is already linked on another device, sign into it there.
            if (!['auth/credential-already-in-use', 'auth/email-already-in-use', 'auth/provider-already-linked'].includes(error?.code)) throw error;
            user = (await authSdk.signInWithPopup(auth, googleProvider)).user;
          }
        } else {
          user = (await authSdk.signInWithPopup(auth, googleProvider)).user;
        }
        await loadUserData(user);
        status.textContent = 'Google 账号已连接；其他设备请使用同一账号登录。';
      } catch (error) {
        console.error('Google account connection failed:', error);
        status.textContent = error?.code === 'auth/popup-blocked'
          ? '浏览器拦截了 Google 登录弹窗；请允许此网站的弹窗后重试。'
          : `账号连接失败（${error?.code || error?.message || '未知错误'}）。请检查 Firebase Google 登录设置。`;
      } finally {
        connectButton.disabled = false;
      }
    };

    // Restore a saved session, but do not create anonymous accounts.
    await auth.authStateReady();
    const user = auth.currentUser;
    if (user) {
      await loadUserData(user);
      status.textContent = user.isAnonymous
        ? '已连接 Firebase。登录 Google 账号即可在其他设备使用同一数据。'
        : '已连接 Firebase 与 Google 账号';
    } else {
      status.textContent = '尚未登录 Google 账号；数据暂存在本机。登录后会同步到 Firebase。';
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    const detail = error?.code || error?.message || '未知错误';
    status.textContent = `Firebase 连接失败（${detail}）；数据仍保存在本机缓存。请检查 Firebase 配置和网络。`;
  }
}
