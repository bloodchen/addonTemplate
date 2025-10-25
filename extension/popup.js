document.addEventListener('DOMContentLoaded', function() {
  const launchBtn = document.getElementById('launchGame');
  
  launchBtn.addEventListener('click', async function() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 向content script发送消息启动游戏
      await chrome.tabs.sendMessage(tab.id, {
        action: 'launchGame',
        url: tab.url
      });
      
      // 关闭popup
      window.close();
    } catch (error) {
      console.error('Error launching game:', error);
      
      // 如果content script还没有注入，先注入再发送消息
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // 等待一下再发送消息
        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'launchGame',
            url: tab.url
          });
        }, 100);
        
        window.close();
      } catch (injectError) {
        console.error('Error injecting content script:', injectError);
      }
    }
  });
});