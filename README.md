# Domain Heroes - Chrome Extension Game

一个基于Chrome插件的Vue3+PixiJS游戏项目，用户点击插件按钮后在当前页面启动游戏。

## 项目结构

```
DomainHeros/
├── extension/          # Chrome插件文件
│   ├── manifest.json   # 插件配置
│   ├── popup.html      # 插件弹窗页面
│   ├── popup.js        # 弹窗逻辑
│   ├── content.js      # 内容脚本
│   ├── background.js   # 后台脚本
│   └── icons/          # 插件图标
├── frontend/           # Vue3+PixiJS前端游戏
│   ├── src/
│   │   ├── components/ # Vue组件
│   │   ├── game/       # PixiJS游戏逻辑
│   │   ├── i18n/       # 国际化配置
│   │   └── assets/     # 静态资源
│   ├── package.json
│   └── vite.config.js
└── backend/            # Fastify后端API
    ├── index.js
    └── package.json
```

## 功能特性

- 🎮 **游戏玩法**: 控制英雄收集域名宝石，建造城堡
- 🌐 **Chrome插件**: 一键在任意网页启动游戏
- 🎨 **现代UI**: Vue3 + PixiJS 打造的精美游戏界面
- 🌍 **国际化**: 支持中文和英文
- 📱 **响应式**: 适配不同屏幕尺寸
- ⚡ **高性能**: 基于Vite构建，快速开发和部署

## 快速开始

### 1. 安装依赖

```bash
# 前端依赖
cd frontend
pnpm install

# 后端依赖
cd ../backend
npm install
```

### 2. 启动开发服务器

```bash
# 启动前端 (localhost:3000)
cd frontend
pnpm dev

# 启动后端 (如需要)
cd backend
npm run dev
```

### 3. 安装Chrome插件

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `extension` 文件夹

### 4. 使用插件

1. 在任意网页点击插件图标
2. 点击"启动游戏"按钮
3. 游戏将在当前页面以iframe形式启动
4. 使用鼠标控制英雄移动和收集宝石

## 游戏操作

- **鼠标点击**: 控制英雄移动到指定位置
- **收集宝石**: 英雄接触宝石自动收集
- **升级系统**: 每收集5个宝石升级一次
- **暂停/继续**: 使用UI按钮控制游戏状态
- **重新开始**: 重置游戏进度

## 技术栈

### 前端
- **Vue 3**: 现代化的JavaScript框架
- **PixiJS**: 高性能2D渲染引擎
- **Vite**: 快速构建工具
- **Vue I18n**: 国际化支持
- **pnpm**: 高效的包管理器

### 后端
- **Fastify**: 高性能Node.js框架
- **PostgreSQL**: 数据库（可选）
- **Redis**: 缓存（可选）

### Chrome插件
- **Manifest V3**: 最新的插件规范
- **Content Scripts**: 页面内容注入
- **Background Service Worker**: 后台处理

## 开发说明

### 插件开发
- 修改 `extension/` 目录下的文件
- 在Chrome扩展管理页面点击"重新加载"更新插件

### 前端开发
- 游戏逻辑在 `frontend/src/game/DomainHeroesGame.js`
- Vue组件在 `frontend/src/components/`
- 国际化配置在 `frontend/src/i18n/`

### 后端开发
- 基于 `rest_template` 模板
- 支持CORS跨域请求
- 可扩展API接口

## 部署

### 前端部署
```bash
cd frontend
pnpm build
# 将 dist/ 目录部署到静态服务器
```

### 插件发布
1. 压缩 `extension/` 目录
2. 上传到Chrome Web Store
3. 等待审核通过

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！