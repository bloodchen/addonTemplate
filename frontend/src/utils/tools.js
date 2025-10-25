import { get } from './util.js'
// Cookie utilities
export const setCookie = (name, value, options = {}) => {
  const {
    days,
    path = '/',
    domain,
    secure = false,
    sameSite,
  } = options

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`

  if (typeof days === 'number') {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    cookie += `; expires=${date.toUTCString()}`
  }

  if (path) cookie += `; path=${path}`
  if (domain) cookie += `; domain=${domain}`
  if (sameSite) cookie += `; samesite=${sameSite}`
  if (secure) cookie += `; secure`

  document.cookie = cookie
}

export const getCookie = (name) => {
  const target = encodeURIComponent(name)
  const pairs = document.cookie ? document.cookie.split('; ') : []
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    const key = pair.substring(0, idx)
    if (key === target) {
      return decodeURIComponent(pair.substring(idx + 1))
    }
  }
  return undefined
}

export const deleteCookie = (name, options = {}) => {
  const { path = '/', domain } = options
  setCookie(name, '', { days: -1, path, domain })
}

// JSON utilities
export const safeJSONParse = (input, fallback = null) => {
  if (input === null || input === undefined) return fallback
  if (typeof input !== 'string') return fallback
  try {
    return JSON.parse(input)
  } catch (e) {
    return fallback
  }
}

export const safeJSONStringify = (value, fallback = '') => {
  try {
    return JSON.stringify(value)
  } catch (e) {
    return fallback
  }
}

// Chrome storage utilities with fallback
const hasChromeStorage = () => {
  try {
    return typeof chrome !== 'undefined' && !!chrome.storage?.local
  } catch {
    return false
  }
}

// KV 缓存提供器（由外部注入，如 game store 的 kv）
let kvProvider = null
export const setKVProvider = (fn) => { kvProvider = fn }
const kvHas = (key) => {
  try {
    if (!kvProvider) return false
    const cache = kvProvider()
    return cache && Object.prototype.hasOwnProperty.call(cache, key)
  } catch (_) { return false }
}
const kvGet = (key, fallback) => {
  try {
    if (!kvProvider) return fallback
    const cache = kvProvider()
    if (!cache) return fallback
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : fallback
  } catch (_) { return fallback }
}
const kvSet = (key, value) => {
  try {
    if (!kvProvider) return
    const cache = kvProvider()
    if (cache) cache[key] = value
  } catch (_) { }
}
const kvDelete = (key) => {
  try {
    if (!kvProvider) return
    const cache = kvProvider()
    if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
      delete cache[key]
    }
  } catch (_) { }
}

// 通过父/顶层窗口进行消息转发到扩展控制器（本地 iframe 负责转发 UD_* 到隐藏窗口）
const postToController = (message, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    const reqId = Date.now() + Math.random().toString(16).slice(2)
    const payload = { ...message, reqId }

    console.log('postToController:', payload)
    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.reqId !== reqId) return
      if (data.type !== 'UD_RESPONSE') return
      window.removeEventListener('message', onMessage)
      console.log("got response:", data)
      resolve(data)
    }

    try {
      window.addEventListener('message', onMessage)
      try { window.parent?.postMessage(payload, '*') } catch (_) { }
      try { window.top?.postMessage(payload, '*') } catch (_) { }
    } catch (err) {
      window.removeEventListener('message', onMessage)
      reject(err)
      return
    }

    setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error(`${message.type} timeout`))
    }, timeout)
  })
}

export const glSave = async (key, value) => {
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('glSave: key must be a non-empty string')
    return false
  }

  try {
    // 优先通过扩展消息通道
    const resp = await postToController({ type: 'UD_STORAGE_SET', key, value }).catch(() => null)
    if (resp && resp.ok) return true

    // 次选：如果有 chrome.storage.local（非 iframe 场景）
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [key]: value })
      return true
    }

    // 回退到 localStorage
    localStorage.setItem(key, safeJSONStringify(value, ''))
    return true
  } catch (e) {
    console.error('glSave error:', e)
    return false
  }
}

export const glRead = async (key, fallback = null) => {
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('glRead: key must be a non-empty string')
    return fallback
  }

  try {

    let result = fallback

    // 优先通过扩展消息通道
    const resp = await postToController({ type: 'UD_STORAGE_GET', key }).catch(() => null)
    if (resp && 'value' in resp) {
      result = resp.value !== undefined ? resp.value : fallback
    } else if (hasChromeStorage()) {
      // 次选：如果有 chrome.storage.local（非 iframe 场景）
      const items = await chrome.storage.local.get([key])
      result = items[key] !== undefined ? items[key] : fallback
    } else {
      // 回退到 localStorage
      const raw = localStorage.getItem(key)
      result = raw !== null ? safeJSONParse(raw, fallback) : fallback
    }

    return result
  } catch (e) {
    console.error('glRead error:', e)
    return fallback
  }
}

export const glDelete = async (key) => {
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('glDelete: key must be a non-empty string')
    return false
  }

  try {

    // 优先通过扩展消息通道
    const resp = await postToController({ type: 'UD_STORAGE_REMOVE', key }).catch(() => null)
    if (resp && resp.ok) return true

    // 次选：如果有 chrome.storage.local（非 iframe 场景）
    if (hasChromeStorage()) {
      await chrome.storage.local.remove([key])
      return true
    }

    // 回退到 localStorage
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.error('glDelete error:', e)
    return false
  }
}

// 默认导出（在所有函数定义之后）

// 创建一个扩展 popup 窗口
export const createPopupWindow = async (winData = {}) => {
  try {
    const resp = await postToController({ type: 'UD_WINDOW_CREATE', ...winData }).catch(() => null)
    return { ok: !!(resp && resp.ok), windowId: resp?.windowId || null }
  } catch (e) {
    console.error('createPopupWindow error:', e)
    return { ok: false, windowId: null }
  }
}

// 隐藏（最小化）扩展窗口
export const hidePopupWindow = async (windowId = null) => {
  try {
    const resp = await postToController({ type: 'UD_WINDOW_HIDE', windowId }).catch(() => null)
    return { ok: !!(resp && resp.ok), windowId: resp?.windowId || windowId || null }
  } catch (e) {
    console.error('hidePopupWindow error:', e)
    return { ok: false, windowId }
  }
}

// 关闭扩展窗口
export const closePopupWindow = async (windowId = null) => {
  try {
    const resp = await postToController({ type: 'UD_WINDOW_CLOSE', windowId }).catch(() => null)
    return { ok: !!(resp && resp.ok) }
  } catch (e) {
    console.error('closePopupWindow error:', e)
    return { ok: false }
  }
}
export const getCurrentUser = async () => {
  try {
    // 先从缓存读取用户信息
    const user = await glRead('currentUser', null)
    if (user) return user

    // 从服务器获取用户信息
    const resp = await get('/user/info')

    // 检查响应是否有错误
    if (resp?.err) {
      console.warn('Failed to get user info:', resp.err)
      return { err: resp.err, user: null }
    }

    // 如果响应正常，缓存用户信息并返回
    if (resp && typeof resp === 'object') {
      await glSave('currentUser', resp)
      return resp
    }

    // 如果响应格式不正确
    console.warn('Invalid user info response format:', resp)
    return { err: 'Invalid response format', user: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { err: error.message || 'Unknown error', user: null }
  }
}

export default {
  setCookie,
  getCookie,
  deleteCookie,
  safeJSONParse,
  safeJSONStringify,
  setKVProvider,
  glSave,
  glRead,
  glDelete,
  createPopupWindow,
  hidePopupWindow,
  closePopupWindow,
  getCurrentUser,
}