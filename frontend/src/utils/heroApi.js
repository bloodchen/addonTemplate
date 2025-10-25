import { get, post, put, del } from './util.js';

/**
 * 英雄API工具函数
 */
export const heroApi = {
  /**
   * 创建新英雄
   * @param {Object} heroData - 英雄数据
   * @param {number|null} heroData.owner - 拥有者UID，可以为null
   * @param {string} heroData.domain - 域名
   * @param {Object} heroData.info - 英雄信息（JSONB）
   * @returns {Promise<Object>} 创建的英雄对象
   */
  async createHero(heroData) {
    return await post('/api/heroes', heroData);
  },

  /**
   * 根据ID获取英雄
   * @param {number} heroId - 英雄ID
   * @returns {Promise<Object|null>} 英雄对象或null
   */
  async getHeroById(heroId) {
    return await get(`/api/heroes/${heroId}`);
  },

  /**
   * 获取英雄列表
   * @param {Object} options - 查询选项
   * @param {number} options.owner - 拥有者UID
   * @param {string} options.domain - 域名
   * @param {boolean} options.unowned - 是否获取无主英雄
   * @param {number} options.limit - 限制数量，默认50
   * @param {number} options.offset - 偏移量，默认0
   * @returns {Promise<Array>} 英雄列表
   */
  async getHeroes(options = {}) {
    const params = new URLSearchParams();
    
    if (options.owner !== undefined) {
      params.append('owner', options.owner);
    }
    if (options.domain) {
      params.append('domain', options.domain);
    }
    if (options.unowned) {
      params.append('unowned', 'true');
    }
    if (options.limit) {
      params.append('limit', options.limit);
    }
    if (options.offset) {
      params.append('offset', options.offset);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/heroes?${queryString}` : '/api/heroes';
    
    return await get(url);
  },

  /**
   * 根据拥有者获取英雄列表
   * @param {number} owner - 拥有者UID
   * @param {number} limit - 限制数量，默认50
   * @param {number} offset - 偏移量，默认0
   * @returns {Promise<Array>} 英雄列表
   */
  async getHerosByOwner(owner, limit = 50, offset = 0) {
    return await this.getHeroes({ owner, limit, offset });
  },

  /**
   * 根据域名获取英雄列表
   * @param {string} domain - 域名
   * @param {number} limit - 限制数量，默认50
   * @param {number} offset - 偏移量，默认0
   * @returns {Promise<Array>} 英雄列表
   */
  async getHerosByDomain(domain, limit = 50, offset = 0) {
    return await this.getHeroes({ domain, limit, offset });
  },

  /**
   * 获取无主英雄列表
   * @param {number} limit - 限制数量，默认50
   * @param {number} offset - 偏移量，默认0
   * @returns {Promise<Array>} 无主英雄列表
   */
  async getUnownedHeroes(limit = 50, offset = 0) {
    return await this.getHeroes({ unowned: true, limit, offset });
  },

  /**
   * 更新英雄信息
   * @param {number} heroId - 英雄ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的英雄对象
   */
  async updateHero(heroId, updateData) {
    return await put(`/api/heroes/${heroId}`, updateData);
  },

  /**
   * 删除英雄
   * @param {number} heroId - 英雄ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteHero(heroId) {
    return await del(`/api/heroes/${heroId}`);
  },

  /**
   * 转移英雄所有权
   * @param {number} heroId - 英雄ID
   * @param {number|null} newOwner - 新拥有者UID，null表示释放所有权
   * @returns {Promise<Object|null>} 更新后的英雄对象
   */
  async transferHero(heroId, newOwner) {
    return await put(`/api/heroes/${heroId}/transfer`, { newOwner });
  },

  /**
   * 获取英雄统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getHeroStats() {
    return await get('/api/heroes/stats');
  }
};

// 导出单个函数以便直接使用
export const {
  createHero,
  getHeroById,
  getHeroes,
  getHerosByOwner,
  getHerosByDomain,
  getUnownedHeroes,
  updateHero,
  deleteHero,
  transferHero,
  getHeroStats
} = heroApi;