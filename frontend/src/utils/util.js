/**
 * 封装的HTTP请求工具函数
 * @param {Object} options - 请求选项
 * @param {string} options.method - 请求方法 (GET, POST, PUT, DELETE等)
 * @param {string} options.path - 请求路径
 * @param {Object|null} options.body - 请求体数据
 * @param {Object|null} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
export async function request(options = {}, headers = null) {
  const { method = 'GET', path = '', body = null } = options;
  
  // 构建完整的URL，使用/api前缀触发Vite代理
  const url = `/api${path}`;
  
  // 默认请求头
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // 合并自定义请求头
  const finalHeaders = { ...defaultHeaders, ...headers };
  
  // 构建fetch选项
  const fetchOptions = {
    method: method.toUpperCase(),
    headers: finalHeaders,
  };
  
  // 如果有请求体且不是GET请求，添加到选项中
  if (body && method.toUpperCase() !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 尝试解析JSON响应
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // 如果不是JSON，返回文本
      return await response.text();
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

/**
 * GET请求的便捷方法
 * @param {string} path - 请求路径
 * @param {Object|null} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
export function get(path, headers = null) {
  return request({ method: 'GET', path }, headers);
}

/**
 * POST请求的便捷方法
 * @param {string} path - 请求路径
 * @param {Object} body - 请求体数据
 * @param {Object|null} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
export function post(path, body, headers = null) {
  return request({ method: 'POST', path, body }, headers);
}

/**
 * PUT请求的便捷方法
 * @param {string} path - 请求路径
 * @param {Object} body - 请求体数据
 * @param {Object|null} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
export function put(path, body, headers = null) {
  return request({ method: 'PUT', path, body }, headers);
}

/**
 * DELETE请求的便捷方法
 * @param {string} path - 请求路径
 * @param {Object|null} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
export function del(path, headers = null) {
  return request({ method: 'DELETE', path }, headers);
}