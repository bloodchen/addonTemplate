// tools.js - 插件通信工具函数

// 发送消息到插件后台脚本的通用函数
window.sendAddonMessage = function(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('sendAddonMessage error:', chrome.runtime.lastError);
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { ok: false, error: 'No response' });
        }
      });
    } catch (err) {
      console.warn('sendAddonMessage exception:', err);
      resolve({ ok: false, error: err.message });
    }
  });
};

// 便捷函数：存储相关
window.udStorage = {
  async get(key) {
    const resp = await window.sendAddonMessage({
      type: 'UD_STORAGE_GET',
      key: key,
      reqId: Date.now()
    });
    return resp.ok ? resp.value : undefined;
  },

  async set(key, value) {
    const resp = await window.sendAddonMessage({
      type: 'UD_STORAGE_SET',
      key: key,
      value: value,
      reqId: Date.now()
    });
    return resp.ok;
  },

  async remove(key) {
    const resp = await window.sendAddonMessage({
      type: 'UD_STORAGE_REMOVE',
      key: key,
      reqId: Date.now()
    });
    return resp.ok;
  }
};

// 便捷函数：心跳检测
window.udPing = async function() {
  const resp = await window.sendAddonMessage({
    type: 'UD_PING_HIDDEN',
    reqId: Date.now()
  });
  return resp.ok;
};

// 调试日志函数
window.udLog = function(...args) {
  console.log('[uDomain iframe]', ...args);
};

// 初始化完成标记
window.udToolsReady = true;
console.log('[uDomain] tools.js loaded');