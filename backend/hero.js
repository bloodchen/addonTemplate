import { BaseService } from './common/baseService.js';

export class Hero extends BaseService {
    async init(gl) {
        this.db = gl.db;
        this.logger = gl.logger;
        this.logger.info('Hero service initialized');
    }

    /**
     * 创建新英雄
     * @param {Object} heroData - 英雄数据
     * @param {number|null} heroData.owner - 拥有者UID，可以为null
     * @param {string} heroData.domain - 域名
     * @param {Object} heroData.info - 英雄信息（JSONB）
     * @returns {Promise<Object>} 创建的英雄对象
     */
    async createHero(heroData) {
        const { owner, domain, info = {} } = heroData;
        
        try {
            const result = await this.db.query(`
                INSERT INTO dh_heros (owner, domain, info)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [owner, domain, JSON.stringify(info)]);
            
            this.logger.info('Hero created', { 
                heroId: result.rows[0].id, 
                owner, 
                domain 
            });
            
            return result.rows[0];
        } catch (error) {
            this.logger.error('Failed to create hero', { error: error.message, heroData });
            throw error;
        }
    }

    /**
     * 根据ID获取英雄
     * @param {number} heroId - 英雄ID
     * @returns {Promise<Object|null>} 英雄对象或null
     */
    async getHeroById(heroId) {
        try {
            const result = await this.db.query(`
                SELECT * FROM dh_heros WHERE id = $1
            `, [heroId]);
            
            return result.rows[0] || null;
        } catch (error) {
            this.logger.error('Failed to get hero by ID', { error: error.message, heroId });
            throw error;
        }
    }

    /**
     * 根据拥有者获取英雄列表
     * @param {number} owner - 拥有者UID
     * @param {number} limit - 限制数量，默认50
     * @param {number} offset - 偏移量，默认0
     * @returns {Promise<Array>} 英雄列表
     */
    async getHerosByOwner(owner, limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
                SELECT * FROM dh_heros 
                WHERE owner = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `, [owner, limit, offset]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get heroes by owner', { error: error.message, owner });
            throw error;
        }
    }

    /**
     * 根据域名获取英雄列表
     * @param {string} domain - 域名
     * @param {number} limit - 限制数量，默认50
     * @param {number} offset - 偏移量，默认0
     * @returns {Promise<Array>} 英雄列表
     */
    async getHerosByDomain(domain, limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
                SELECT * FROM dh_heros 
                WHERE domain = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `, [domain, limit, offset]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get heroes by domain', { error: error.message, domain });
            throw error;
        }
    }

    /**
     * 获取无主英雄列表
     * @param {number} limit - 限制数量，默认50
     * @param {number} offset - 偏移量，默认0
     * @returns {Promise<Array>} 无主英雄列表
     */
    async getUnownedHeroes(limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
                SELECT * FROM dh_heros 
                WHERE owner IS NULL 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get unowned heroes', { error: error.message });
            throw error;
        }
    }

    /**
     * 更新英雄信息
     * @param {number} heroId - 英雄ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object|null>} 更新后的英雄对象
     */
    async updateHero(heroId, updateData) {
        const { owner, domain, info } = updateData;
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (owner !== undefined) {
            updates.push(`owner = $${paramIndex++}`);
            values.push(owner);
        }
        
        if (domain !== undefined) {
            updates.push(`domain = $${paramIndex++}`);
            values.push(domain);
        }
        
        if (info !== undefined) {
            updates.push(`info = $${paramIndex++}`);
            values.push(JSON.stringify(info));
        }

        if (updates.length === 0) {
            throw new Error('No update data provided');
        }

        values.push(heroId);

        try {
            const result = await this.db.query(`
                UPDATE dh_heros 
                SET ${updates.join(', ')}, updated_at = now()
                WHERE id = $${paramIndex}
                RETURNING *
            `, values);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            this.logger.info('Hero updated', { 
                heroId, 
                updateData: Object.keys(updateData) 
            });
            
            return result.rows[0];
        } catch (error) {
            this.logger.error('Failed to update hero', { error: error.message, heroId, updateData });
            throw error;
        }
    }

    /**
     * 删除英雄
     * @param {number} heroId - 英雄ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteHero(heroId) {
        try {
            const result = await this.db.query(`
                DELETE FROM dh_heros WHERE id = $1
            `, [heroId]);
            
            const deleted = result.rowCount > 0;
            
            if (deleted) {
                this.logger.info('Hero deleted', { heroId });
            }
            
            return deleted;
        } catch (error) {
            this.logger.error('Failed to delete hero', { error: error.message, heroId });
            throw error;
        }
    }

    /**
     * 转移英雄所有权
     * @param {number} heroId - 英雄ID
     * @param {number|null} newOwner - 新拥有者UID，null表示释放所有权
     * @returns {Promise<Object|null>} 更新后的英雄对象
     */
    async transferHero(heroId, newOwner) {
        try {
            const result = await this.db.query(`
                UPDATE dh_heros 
                SET owner = $1, updated_at = now()
                WHERE id = $2
                RETURNING *
            `, [newOwner, heroId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            this.logger.info('Hero ownership transferred', { 
                heroId, 
                newOwner: newOwner || 'released' 
            });
            
            return result.rows[0];
        } catch (error) {
            this.logger.error('Failed to transfer hero', { error: error.message, heroId, newOwner });
            throw error;
        }
    }

    /**
     * 获取英雄统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getHeroStats() {
        try {
            const result = await this.db.query(`
                SELECT 
                    COUNT(*) as total_heroes,
                    COUNT(owner) as owned_heroes,
                    COUNT(*) - COUNT(owner) as unowned_heroes,
                    COUNT(DISTINCT owner) as unique_owners,
                    COUNT(DISTINCT domain) as unique_domains
                FROM dh_heros
            `);
            
            return result.rows[0];
        } catch (error) {
            this.logger.error('Failed to get hero stats', { error: error.message });
            throw error;
        }
    }
}