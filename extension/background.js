// ---------------- Runtime Bridge (migrated from bridge.js) ----------------

// 便捷：获取当前活动标签页ID
async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0] ? tabs[0].id : null;
}

// 在页面中执行脚本（用于关闭/调整游戏窗口）
async function execInPage(fn, args = []) {
  const tabId = await getActiveTabId();
  if (!tabId) return { ok: false, error: 'No active tab' };
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: fn,
      args
    });
    return { ok: true, result: result?.result };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, reqId } = message || {};
  if (!type) return;
  console.log('[uDomain background] onMessage:', type, message);

  try {
    // 心跳/监测（两种类型兼容）
    if (type === 'UD_PING_HIDDEN' || type === 'UD_HEARTBEAT' || type === 'PING_HIDDEN') {
      sendResponse({ ok: true, ts: Date.now(), type: 'UD_RESPONSE', reqId });
      return; // 同步返回
    }

    // Storage 桥接（兼容 UD_* 与非 UD_*）
    if (type === 'UD_STORAGE_GET' || type === 'UD_STORAGE_SET' || type === 'UD_STORAGE_REMOVE') {
      (async () => {
        const key = message.key;
        const value = message.value;
        try {
          if (type.endsWith('GET')) {
            const result = await chrome.storage.local.get(key);
            sendResponse({ ok: true, key, value: result[key], type: 'UD_RESPONSE', reqId });
          } else if (type.endsWith('SET')) {
            await chrome.storage.local.set({ [key]: value });
            sendResponse({ ok: true, key, type: 'UD_RESPONSE', reqId });
          } else if (type.endsWith('REMOVE')) {
            await chrome.storage.local.remove(key);
            sendResponse({ ok: true, key, type: 'UD_RESPONSE', reqId });
          }
        } catch (err) {
          sendResponse({ ok: false, key, error: err?.message || String(err), type: 'UD_RESPONSE', reqId });
        }
      })();
      return true; // 异步响应
    }

    // Window 桥接（兼容 UD_* 与非 UD_*）
    if (type === 'UD_WINDOW_CREATE' || type === 'UD_WINDOW_HIDE' || type === 'UD_WINDOW_CLOSE') {
      (async () => {
        try {
          if (type.endsWith('CREATE')) {
            const { url, name, width, height, focused, incognito, state, windowType, left, top } = message;

            // 单实例窗口：若 name 存在，则先按 name 查找并激活
            const instanceName = (name || '').trim();
            if (instanceName) {
              try {
                const stored = await chrome.storage.local.get('ud_window_map');
                const map = stored && stored.ud_window_map ? stored.ud_window_map : {};
                const existingId = map[instanceName];
                if (existingId) {
                  // 检查窗口是否仍存在
                  const existingWin = await chrome.windows.get(existingId, { populate: false }).catch(() => null);
                  if (existingWin && existingWin.id) {
                    // 激活现有窗口
                    await chrome.windows.update(existingWin.id, { focused: true, state: 'normal', drawAttention: true });
                    sendResponse({ ok: true, windowId: existingWin.id, type: 'UD_RESPONSE', reqId });
                    return;
                  }
                }
              } catch (_) { /* 忽略并继续创建新窗口 */ }
            }

            // 未找到或无 name：创建新窗口
            const createData = { url, width, height, focused, incognito, state, type: windowType };
            if (typeof left === 'number') createData.left = left;
            if (typeof top === 'number') createData.top = top;
            const win = await chrome.windows.create(createData);
            // 若指定了 name，记录映射关系
            if (instanceName && win && win.id) {
              try {
                const stored = await chrome.storage.local.get('ud_window_map');
                const map = stored && stored.ud_window_map ? stored.ud_window_map : {};
                map[instanceName] = win.id;
                await chrome.storage.local.set({ ud_window_map: map });
              } catch (_) { /* 记录失败不影响窗口创建 */ }
            }
            sendResponse({ ok: true, windowId: win?.id || null, type: 'UD_RESPONSE', reqId });
          } else if (type.endsWith('HIDE')) {
            const { windowId } = message;
            await chrome.windows.update(windowId, { state: 'minimized' });
            sendResponse({ ok: true, windowId, type: 'UD_RESPONSE', reqId });
          } else if (type.endsWith('CLOSE')) {
            const { windowId } = message;
            await chrome.windows.remove(windowId);
            sendResponse({ ok: true, windowId, type: 'UD_RESPONSE', reqId });
          }
        } catch (err) {
          console.error('[uDomain background] onMessage:', type, message, err);
          sendResponse({ ok: false, error: err?.message || String(err), windowId: message.windowId || null, type: 'UD_RESPONSE', reqId });
        }
      })();
      return true; // 异步响应
    }

    // 页面级动作：关闭游戏窗口（兼容 UD_* 与非 UD_*）
    if (type === 'UD_CLOSE_GAME' || type === 'CLOSE_GAME') {
      (async () => {
        const res = await execInPage(() => {
          try {
            if (window.__udGameFrame && typeof window.__udGameFrame.destroy === 'function') {
              window.__udGameFrame.destroy();
              return true;
            }
            const iframe = document.getElementById('ud-core-iframe');
            if (iframe && iframe.parentElement) {
              iframe.parentElement.remove();
              return true;
            }
            return false;
          } catch (_) { return false; }
        });
        sendResponse({ ok: !!res.ok, type: 'UD_RESPONSE', reqId });
      })();
      return true; // 异步响应
    }

    // 页面级动作：调整大小（兼容 UD_* 与非 UD_*）
    if (type === 'UD_RESIZE_PAGE' || type === 'RESIZE_PAGE') {
      (async () => {
        const size = message.size || {};
        await execInPage((s) => {
          try {
            if (window.__udGameFrame && typeof window.__udGameFrame.resize === 'function') {
              window.__udGameFrame.resize(s.width, s.height);
              return true;
            }
            const iframe = document.getElementById('ud-core-iframe');
            if (iframe) {
              if (s.width) iframe.style.width = s.width + 'px';
              if (s.height) iframe.style.height = s.height + 'px';
              return true;
            }
            return false;
          } catch (_) { return false; }
        }, [size]);
        sendResponse({ ok: true, type: 'UD_RESPONSE', reqId });
      })();
      return true; // 异步响应
    }

  } catch (err) {
    try { sendResponse({ ok: false, error: err?.message || String(err) }); } catch (_) { }
  }
});
// 点击扩展图标时，在当前页面注入游戏弹窗
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 检查是否可以在当前页面执行脚本
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      // 在特殊页面显示提示
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showUnsupportedPageMessage
      });
      return;
    }
    // 在普通网页中注入游戏
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
});

// 在不支持的页面显示提示信息
function showUnsupportedPageMessage() {
  alert('域名探索RPG无法在此页面运行。请在普通网页中使用此扩展。');
}

// 浏览器启动时创建一个最小化的总控窗口（加载 hidden.html）
// 取消 hidden.html：无需在安装时创建总控窗口