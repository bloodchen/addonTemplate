// Domain Heroes Content Script
let gameIframe = null;
let isGameActive = false;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'launchGame') {
    launchGame(request.url);
    sendResponse({ success: true });
  } else if (request.action === 'closeGame') {
    closeGame();
    sendResponse({ success: true });
  }
});

function launchGame(currentUrl) {
  if (isGameActive) {
    // 如果游戏已经在运行，先关闭再重新启动
    closeGame();
  }
  
  // 创建游戏容器
  const gameContainer = document.createElement('div');
  gameContainer.id = 'domain-heroes-container';
  gameContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // 创建iframe
  gameIframe = document.createElement('iframe');
  gameIframe.id = 'domain-heroes-iframe';
  gameIframe.style.cssText = `
    width: 90vw;
    height: 90vh;
    max-width: 1200px;
    max-height: 800px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  `;
  
  // 设置iframe源，使用插件内部的iframe.html
  const extensionUrl = chrome.runtime.getURL('iframe.html');
  const gameUrl = `${extensionUrl}?sourceUrl=${encodeURIComponent(currentUrl)}`;
  gameIframe.src = gameUrl;
  
  // 创建关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 1000000;
  `;
  
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = '#ff4757';
    closeButton.style.color = 'white';
    closeButton.style.transform = 'scale(1.1)';
  });
  
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
    closeButton.style.color = '#333';
    closeButton.style.transform = 'scale(1)';
  });
  
  closeButton.addEventListener('click', closeGame);
  
  // 组装容器
  gameContainer.appendChild(gameIframe);
  gameContainer.appendChild(closeButton);
  
  // 添加到页面
  document.body.appendChild(gameContainer);
  
  // 添加ESC键关闭功能
  document.addEventListener('keydown', handleEscKey);
  
  // 防止页面滚动
  document.body.style.overflow = 'hidden';
  
  isGameActive = true;
  
  console.log('Domain Heroes game launched with URL:', currentUrl);
}

function closeGame() {
  if (gameIframe && gameIframe.parentNode) {
    const container = document.getElementById('domain-heroes-container');
    if (container) {
      container.remove();
    }
  }
  
  // 移除ESC键监听
  document.removeEventListener('keydown', handleEscKey);
  
  // 恢复页面滚动
  document.body.style.overflow = '';
  
  gameIframe = null;
  isGameActive = false;
  
  console.log('Domain Heroes game closed');
}

function handleEscKey(event) {
  if (event.key === 'Escape' && isGameActive) {
    closeGame();
  }
}

// 监听iframe加载错误
function handleIframeError() {
  console.warn('Game iframe failed to load. Make sure the frontend server is running on localhost:5174');
  
  // 显示错误信息
  if (gameIframe) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    errorDiv.innerHTML = `
      <h3 style="color: #e74c3c; margin-top: 0;">游戏加载失败</h3>
      <p style="color: #666;">请确保前端服务器正在 localhost:5174 运行</p>
      <button onclick="this.parentNode.parentNode.remove(); document.body.style.overflow = ''" 
              style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
        关闭
      </button>
    `;
    
    gameIframe.parentNode.appendChild(errorDiv);
  }
}