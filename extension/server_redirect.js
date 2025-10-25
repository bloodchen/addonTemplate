(function () {
  'use strict';

  function setMessage(text, ok = true) {
    var el = document.getElementById('message');
    if (!el) return;
    el.textContent = text;
    el.style.color = ok ? '#065f46' : '#b91c1c';
  }

  async function handleLoginReturn(params) {
    var token = params.get('token');
    if (!token) {
      setMessage('登录失败', false);
      return;
    }
    try {
      await chrome.storage.local.set({ udomain_ut: String(token) })
      var err = chrome.runtime && chrome.runtime.lastError;
      if (err) {
        setMessage('保存失败：' + err.message, false);
      } else {
        setMessage('登录成功，令牌已保存');
        await sendAddonMessage({ type: 'UD_LoginSuccess', token: String(token) });
        window.close()
      }
    } catch (e) {
      setMessage('保存异常：' + e.message, false);
    }
  }

  function main() {
    var params = new URLSearchParams(window.location.search || '');
    var cmd = (params.get('cmd') || '').trim();

    if (!cmd) {
      setMessage('未提供 cmd 参数', false);
      return;
    }

    if (cmd === 'loginReturn') {
      handleLoginReturn(params);
      return;
    }

    setMessage('未知指令：' + cmd, false);
  }

  document.addEventListener('DOMContentLoaded', main);
})();