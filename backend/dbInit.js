export async function createTables(db) {
    try {
        //users
        if (!await db.tableExists('dh_users')) {
            await db.query(`
        CREATE TABLE IF NOT EXISTS dh_users (
        uid SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        pass TEXT NOT NULL,
        frm INTEGER DEFAULT 0,
        info JSONB DEFAULT '{}',
        credits INT DEFAULT 0,
        settings JSONB DEFAULT '{}',
        is_active       BOOLEAN DEFAULT TRUE,
        is_banned       BOOLEAN DEFAULT FALSE,
        locale          TEXT DEFAULT 'en',             -- 用户语言，例如 'en', 'zh-CN'
        level INTEGER DEFAULT 0,
        level_exp INTEGER DEFAULT 0,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 1
        );
        ALTER SEQUENCE users_uid_seq RESTART WITH 1000;

        -- 创建索引（加上 IF NOT EXISTS)
        DO $$
        BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_uid') THEN
            CREATE INDEX idx_users_uid ON dh_users(uid);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_email') THEN
            CREATE INDEX idx_users_email ON dh_users(email);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_status') THEN
            CREATE INDEX idx_users_status ON dh_users(status);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_from') THEN
            CREATE INDEX idx_users_from ON dh_users(frm);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_created_at') THEN
            CREATE INDEX idx_users_created_at ON dh_users(created_at);
        END IF;
        END
        $$;

        -- 创建触发器（避免重复创建)
        DO $$
        BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
        ) THEN
            CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON dh_users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
        END
        $$;
      `)
        }



        // payments 表
        if (!await db.tableExists('dh_payments')) {
            await db.query(`
            CREATE TABLE IF NOT EXISTS dh_payments (
            id BIGSERIAL PRIMARY KEY,
            uid BIGINT REFERENCES dh_users(uid),
            email TEXT,
            order_id TEXT UNIQUE,
            amount BIGINT NOT NULL,
            type INT DEFAULT 0,
            meta JSONB DEFAULT '{}',
            sysinfo JSONB DEFAULT '{}',

            -- 生成列，直接从 meta 提取
            pid TEXT GENERATED ALWAYS AS (meta->>'pid') STORED,
            did TEXT GENERATED ALWAYS AS (meta->>'did') STORED,

            created_at TIMESTAMPTZ DEFAULT now()
        );

        -- 单列索引
        CREATE INDEX IF NOT EXISTS idx_payments_pid ON dh_payments (pid);
        CREATE INDEX IF NOT EXISTS idx_payments_did ON dh_payments (did);

        -- 联合索引（常用组合查询）
        CREATE INDEX IF NOT EXISTS idx_payments_pid_did ON dh_payments (pid, did);
        SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM dh_payments), 1000), true);
        `);
        }

        // dh_heros 表 - 英雄表
        if (!await db.tableExists('dh_heros')) {
            await db.query(`
            CREATE TABLE IF NOT EXISTS dh_heros (
                id BIGSERIAL PRIMARY KEY,
                owner BIGINT REFERENCES dh_users(uid) ON DELETE SET NULL,
                domain TEXT,
                info JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );

            -- 创建索引
            CREATE INDEX IF NOT EXISTS idx_heros_owner ON dh_heros (owner);
            CREATE INDEX IF NOT EXISTS idx_heros_domain ON dh_heros (domain);
            CREATE INDEX IF NOT EXISTS idx_heros_owner_domain ON dh_heros (owner, domain);
            CREATE INDEX IF NOT EXISTS idx_heros_created_at ON dh_heros (created_at);

            -- 创建更新时间触发器
            CREATE TRIGGER update_heros_updated_at
                BEFORE UPDATE ON dh_heros
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            SELECT setval('dh_heros_id_seq', COALESCE((SELECT MAX(id) FROM dh_heros), 1000), true);
            `);
        }

        console.log('✅ Tables created.');

        // ---- 添加索引 ----


        console.log('✅ Indexes created.');

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}