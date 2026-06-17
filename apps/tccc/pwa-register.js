// 等待页面加载完成后注册Service Worker
document.addEventListener('DOMContentLoaded', () => {
  // 检查浏览器是否支持Service Worker
  if ('serviceWorker' in navigator) {
    registerServiceWorker();
    checkConnectivity();
  } else {
    console.log('您的浏览器不支持Service Worker和PWA功能');
  }
});

// 注册Service Worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker注册成功，作用域：', registration.scope);
    
    // 检查是否有Service Worker更新
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 有新版本可用
            console.log('新版本可用，请刷新页面');
            showUpdateNotification();
          } else {
            // 首次安装
            console.log('应用已安装并可离线使用');
            showOfflineReadyNotification();
          }
        }
      };
    };
  } catch (error) {
    console.error('Service Worker注册失败：', error);
  }
}

// 检查网络连接状态
function checkConnectivity() {
  // 首次检查网络状态
  updateOnlineStatus();
  
  // 监听网络状态变化
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// 更新网络状态
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  
  if (isOnline) {
    console.log('网络已连接');
    // 可以在这里添加重新连接时的操作
  } else {
    console.log('网络已断开');
    // 可以在这里添加断开连接时的操作
  }
}

// 显示更新通知
function showUpdateNotification() {
  // 检查是否支持通知API
  if (!('Notification' in window)) return;
  
  // 检查通知权限
  if (Notification.permission === 'granted') {
    createUpdateNotification();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        createUpdateNotification();
      }
    });
  }
}

// 创建更新通知
function createUpdateNotification() {
  const notification = new Notification('TCCC流程应用已更新', {
    body: '新版本已下载完成，刷新页面即可使用',
    icon: '/icons/icon-192.png'
  });
  
  notification.onclick = () => {
    window.location.reload();
  };
}

// 显示离线就绪通知
function showOfflineReadyNotification() {
  // 检查是否支持通知API
  if (!('Notification' in window)) return;
  
  // 检查通知权限
  if (Notification.permission === 'granted') {
    const notification = new Notification('TCCC流程应用已安装', {
      body: '应用已准备好离线使用',
      icon: '/icons/icon-192.png'
    });
  }
}

// 检查是否需要安装PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止Chrome 67及更早版本自动显示安装提示
  e.preventDefault();
  
  // 存储事件以便稍后触发
  window.deferredPrompt = e;
  
  // 可以在这里显示自定义的安装按钮或提示
  showInstallPromotion();
});

// 显示安装提示
function showInstallPromotion() {
  // 可以在这里添加自定义的安装按钮显示逻辑
  console.log('应用可以安装为PWA');
  
  // 示例：如果页面中有一个ID为installPWA的按钮
  const installButton = document.getElementById('installPWA');
  
  if (installButton) {
    installButton.style.display = 'block';
    
    installButton.addEventListener('click', () => {
      if (window.deferredPrompt) {
        // 显示安装提示
        window.deferredPrompt.prompt();
        
        // 等待用户响应
        window.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('用户接受安装');
          } else {
            console.log('用户拒绝安装');
          }
          
          // 清除事件引用
          window.deferredPrompt = null;
          
          // 隐藏安装按钮
          installButton.style.display = 'none';
        });
      }
    });
  }
} 
