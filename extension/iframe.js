(() => {
  const remoteBase = 'http://localhost:5174';
  const remotePath = '/';
  const params = new URLSearchParams(window.location.search);
  const remoteUrl = remoteBase + remotePath + (params.toString() ? ('?' + params.toString()) : '');

  function postToRemote(frameWin, message) {
    try {
      frameWin.postMessage(message, remoteBase);
    } catch (err) {
      console.warn('postToRemote failed:', err);
    }
  }

  function sendResponse(frameWin, msg) {
    postToRemote(frameWin, msg);
  }
  
  function init() {
    const frame = document.getElementById('remoteFrame');
    frame.src = remoteUrl;

    // 转发内部iframe发来的 UD_* 消息到隐藏窗口（通过 chrome.runtime 消息）
    window.addEventListener('message', async function (e) {
      const fromRemote = typeof e.origin === 'string' && e.origin.startsWith(remoteBase);
      if (!(frame && e.source === frame.contentWindow && fromRemote)) return;
      const data = e.data || {};
      const t = data && data.type;
      if (typeof t !== 'string' || !t.startsWith('UD_')) return;
      // 仅处理 UD_*：通过 runtime 转发并回传响应到远端 iframe
      const resp = await window.sendAddonMessage(data);
      try { sendResponse(frame.contentWindow, resp); } catch (_) { }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const { type, reqId } = message || {};
      if (!type.startsWith('UD_')) return;
      postToRemote(frame.contentWindow, message)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();