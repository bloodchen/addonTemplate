import fastifyModule from 'fastify';
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fasticookie from '@fastify/cookie'

import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

import { Logger } from './logger.js';
import { Config } from './config.js';
import { Util } from './common/util.js';

dotenv.config({ path: "./env" })
const app = fastifyModule({ logger: false });
const gl = {}
// 创建默认logger实例
const logger = new Logger({
    serviceName: process.env.APP_NAME || 'rest-template',
    logDir: process.env.LOG_DIR || './logs'
});
gl.logger = logger
gl.app = app
gl.config = Config
async function onExit() {
    console.log("exiting...")
    process.exit(0);
}
async function startServer() {
    const port = process.env.PORT || 8080
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Starting ${process.env.APP_NAME} service on:`, port)
}

async function main() {
    // 注册静态文件服务
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    gl.appPath = __dirname
    await regEndpoints()
    //create more classes here
    await Util.create(gl)
    if (process.env.Modules.indexOf("redis") != -1) {
        const { Redis } = await import('./redis.js')
        await Redis.create(gl)
    }
    if (process.env.Modules.indexOf("user") != -1) {
        const { DB } = await import('./db.js')
        await DB.create(gl)
        const { User } = await import('./user.js')
        await User.create(gl)
    }
    if (process.env.Modules.indexOf("hero") != -1) {
        // 确保数据库已初始化
        if (!gl.db) {
            const { DB } = await import('./db.js')
            await DB.create(gl)
        }
        const { Hero } = await import('./hero.js')
        await Hero.create(gl)
    }

    await startServer()
    process.on('SIGINT', onExit);
    process.on('SIGTERM', onExit);
}
async function regEndpoints() {

    await app.register(fastifyStatic, {
        root: path.join(gl.appPath, 'static'),
        prefix: '/static/'
    });
    await app.register(fasticookie)


    await app.register(cors, { origin: true, credentials: true, allowedHeaders: ['content-type'] });
    app.addHook("preHandler", async (req, res) => {
        console.log(req.url)
        if (req.query._testuid) {
            req.uid = Number(req.query._testuid)//req.query.uid
            return
        }
    })
    app.get('/', (req, res) => {
        console.log(req.url)
        return Config.project.name
    })
    app.get('/test', async (req, res) => {

        return "ok"
    })
    app.post('/logSearch', async (req, res) => {
        const body = req.body
        console.log(body)
        return "ok"
    })
    app.post('/notify/_commonapi', async (req, res) => {
        const body = req.body
        console.log(body)
        const { cmd, result } = body
        const { event, data } = body
        if (event === 'login_success') {
            const { user } = gl
            await user.handleLoginSuccessful_fromCommonAPI(data)
        }
        if (event === 'order_paid') {
            const { user } = gl
            await user.handleOrderPaid_fromCommonAPI(data)
        }
        return "ok"
    })

    // Hero API endpoints
    app.post('/api/heroes', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const heroData = req.body;
            const newHero = await hero.createHero(heroData);
            return res.send({ success: true, data: newHero });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.get('/api/heroes/:id', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const heroId = parseInt(req.params.id);
            const heroData = await hero.getHeroById(heroId);
            
            if (!heroData) {
                return res.code(404).send({ error: 'Hero not found' });
            }
            
            return res.send({ success: true, data: heroData });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.get('/api/heroes', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const { owner, domain, unowned, limit = 50, offset = 0 } = req.query;
            let heroes;
            
            if (unowned === 'true') {
                heroes = await hero.getUnownedHeroes(parseInt(limit), parseInt(offset));
            } else if (owner) {
                heroes = await hero.getHerosByOwner(parseInt(owner), parseInt(limit), parseInt(offset));
            } else if (domain) {
                heroes = await hero.getHerosByDomain(domain, parseInt(limit), parseInt(offset));
            } else {
                // 默认返回无主英雄
                heroes = await hero.getUnownedHeroes(parseInt(limit), parseInt(offset));
            }
            
            return res.send({ success: true, data: heroes });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.put('/api/heroes/:id', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const heroId = parseInt(req.params.id);
            const updateData = req.body;
            const updatedHero = await hero.updateHero(heroId, updateData);
            
            if (!updatedHero) {
                return res.code(404).send({ error: 'Hero not found' });
            }
            
            return res.send({ success: true, data: updatedHero });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.delete('/api/heroes/:id', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const heroId = parseInt(req.params.id);
            const deleted = await hero.deleteHero(heroId);
            
            if (!deleted) {
                return res.code(404).send({ error: 'Hero not found' });
            }
            
            return res.send({ success: true, message: 'Hero deleted successfully' });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.put('/api/heroes/:id/transfer', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const heroId = parseInt(req.params.id);
            const { newOwner } = req.body;
            const transferredHero = await hero.transferHero(heroId, newOwner);
            
            if (!transferredHero) {
                return res.code(404).send({ error: 'Hero not found' });
            }
            
            return res.send({ success: true, data: transferredHero });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });

    app.get('/api/heroes/stats', async (req, res) => {
        try {
            const { hero } = gl;
            if (!hero) {
                return res.code(500).send({ error: 'Hero service not available' });
            }
            
            const stats = await hero.getHeroStats();
            return res.send({ success: true, data: stats });
        } catch (error) {
            return res.code(500).send({ error: error.message });
        }
    });
}
main()
