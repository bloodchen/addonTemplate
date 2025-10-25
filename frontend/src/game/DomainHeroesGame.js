import * as PIXI from 'pixi.js'

export class DomainHeroesGame {
  constructor(options = {}) {
    this.container = options.container
    this.sourceUrl = options.sourceUrl || ''
    this.onStatsUpdate = options.onStatsUpdate || (() => {})
    
    // 游戏状态
    this.gameStats = {
      score: 0,
      level: 1,
      gems: 0
    }
    
    this.isPaused = false
    this.isDestroyed = false
    
    // PixiJS应用
    this.app = null
    this.hero = null
    this.gems = []
    this.castle = null
    
    this.init()
  }
  
  async init() {
    // 创建PixiJS应用
    this.app = new PIXI.Application()
    
    await this.app.init({
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e,
      antialias: true
    })
    
    // 将canvas添加到容器
    this.container.appendChild(this.app.canvas)
    
    // 设置canvas样式
    this.app.canvas.style.width = '100%'
    this.app.canvas.style.height = '100%'
    this.app.canvas.style.display = 'block'
    
    // 创建游戏场景
    this.createScene()
    
    // 设置游戏循环
    this.app.ticker.add(this.gameLoop.bind(this))
    
    console.log('Domain Heroes Game initialized with source URL:', this.sourceUrl)
  }
  
  createScene() {
    // 创建背景
    this.createBackground()
    
    // 创建城堡
    this.createCastle()
    
    // 创建英雄
    this.createHero()
    
    // 创建宝石
    this.createGems()
    
    // 添加交互
    this.setupInteraction()
  }
  
  createBackground() {
    // 创建星空背景
    const background = new PIXI.Graphics()
    background.rect(0, 0, this.app.screen.width, this.app.screen.height)
    background.fill(0x0f0f23)
    this.app.stage.addChild(background)
    
    // 添加星星
    for (let i = 0; i < 100; i++) {
      const star = new PIXI.Graphics()
      star.circle(0, 0, Math.random() * 2 + 1)
      star.fill(0xffffff)
      star.x = Math.random() * this.app.screen.width
      star.y = Math.random() * this.app.screen.height
      star.alpha = Math.random() * 0.8 + 0.2
      this.app.stage.addChild(star)
    }
  }
  
  createCastle() {
    // 创建城堡容器
    this.castle = new PIXI.Container()
    
    // 城堡主体
    const castleBody = new PIXI.Graphics()
    castleBody.rect(50, 400, 150, 100)
    castleBody.fill(0x4a5568)
    this.castle.addChild(castleBody)
    
    // 城堡塔楼
    const tower1 = new PIXI.Graphics()
    tower1.rect(30, 350, 40, 80)
    tower1.fill(0x2d3748)
    this.castle.addChild(tower1)
    
    const tower2 = new PIXI.Graphics()
    tower2.rect(80, 330, 40, 100)
    tower2.fill(0x2d3748)
    this.castle.addChild(tower2)
    
    const tower3 = new PIXI.Graphics()
    tower3.rect(130, 330, 40, 100)
    tower3.fill(0x2d3748)
    this.castle.addChild(tower3)
    
    const tower4 = new PIXI.Graphics()
    tower4.rect(180, 350, 40, 80)
    tower4.fill(0x2d3748)
    this.castle.addChild(tower4)
    
    // 城堡旗杆
    const flagPole = new PIXI.Graphics()
    flagPole.rect(98, 310, 4, 30)
    flagPole.fill(0x8b4513)
    this.castle.addChild(flagPole)
    
    // 城堡旗帜
    const flag = new PIXI.Graphics()
    flag.moveTo(102, 310)
    flag.lineTo(130, 320)
    flag.lineTo(102, 330)
    flag.fill(0xe53e3e)
    this.castle.addChild(flag)
    
    this.app.stage.addChild(this.castle)
  }
  
  createHero() {
    // 创建英雄容器
    this.hero = new PIXI.Container()
    
    // 英雄身体
    const body = new PIXI.Graphics()
    body.circle(0, 0, 15)
    body.fill(0x3498db)
    this.hero.addChild(body)
    
    // 英雄头部
    const head = new PIXI.Graphics()
    head.circle(0, -20, 8)
    head.fill(0xf39c12)
    this.hero.addChild(head)
    
    // 英雄武器
    const weapon = new PIXI.Graphics()
    weapon.rect(-2, -35, 4, 20)
    weapon.fill(0x95a5a6)
    this.hero.addChild(weapon)
    
    this.hero.x = 400
    this.hero.y = 300
    
    // 添加英雄属性
    this.hero.speed = 3
    this.hero.targetX = this.hero.x
    this.hero.targetY = this.hero.y
    
    this.app.stage.addChild(this.hero)
  }
  
  createGems() {
    // 创建宝石
    for (let i = 0; i < 10; i++) {
      this.spawnGem()
    }
  }
  
  spawnGem() {
    const gem = new PIXI.Graphics()
    
    // 宝石形状（菱形）
    gem.moveTo(0, -10)
    gem.lineTo(8, 0)
    gem.lineTo(0, 10)
    gem.lineTo(-8, 0)
    gem.lineTo(0, -10)
    
    // 随机宝石颜色
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3]
    gem.fill(colors[Math.floor(Math.random() * colors.length)])
    
    // 随机位置
    gem.x = Math.random() * (this.app.screen.width - 100) + 50
    gem.y = Math.random() * (this.app.screen.height - 100) + 50
    
    // 确保不在城堡区域生成
    if (gem.x < 250 && gem.y > 300) {
      gem.x += 250
    }
    
    // 添加闪烁效果
    gem.alpha = 0.8
    gem.rotation = Math.random() * Math.PI * 2
    
    this.gems.push(gem)
    this.app.stage.addChild(gem)
  }
  
  setupInteraction() {
    // 鼠标/触摸交互
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    
    this.app.stage.on('pointerdown', (event) => {
      if (!this.isPaused) {
        const position = event.global
        this.hero.targetX = position.x
        this.hero.targetY = position.y
      }
    })
  }
  
  gameLoop(delta) {
    if (this.isPaused || this.isDestroyed) return
    
    // 更新英雄移动
    this.updateHero(delta)
    
    // 更新宝石动画
    this.updateGems(delta)
    
    // 检查碰撞
    this.checkCollisions()
    
    // 更新统计信息
    this.updateStats()
  }
  
  updateHero(delta) {
    const dx = this.hero.targetX - this.hero.x
    const dy = this.hero.targetY - this.hero.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 5) {
      const moveX = (dx / distance) * this.hero.speed * delta
      const moveY = (dy / distance) * this.hero.speed * delta
      
      this.hero.x += moveX
      this.hero.y += moveY
      
      // 英雄旋转朝向移动方向
      this.hero.rotation = Math.atan2(dy, dx) + Math.PI / 2
    }
  }
  
  updateGems(delta) {
    this.gems.forEach(gem => {
      // 宝石旋转动画
      gem.rotation += 0.02 * delta
      
      // 宝石闪烁效果
      gem.alpha = 0.6 + Math.sin(Date.now() * 0.005 + gem.x) * 0.3
    })
  }
  
  checkCollisions() {
    // 检查英雄与宝石的碰撞
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i]
      const dx = this.hero.x - gem.x
      const dy = this.hero.y - gem.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 25) {
        // 收集宝石
        this.collectGem(i)
      }
    }
  }
  
  collectGem(index) {
    const gem = this.gems[index]
    
    // 移除宝石
    this.app.stage.removeChild(gem)
    this.gems.splice(index, 1)
    
    // 更新游戏状态
    this.gameStats.gems += 1
    this.gameStats.score += 10
    
    // 检查升级
    if (this.gameStats.gems % 5 === 0) {
      this.gameStats.level += 1
      this.hero.speed += 0.5
    }
    
    // 生成新宝石
    this.spawnGem()
    
    console.log('Gem collected! Stats:', this.gameStats)
  }
  
  updateStats() {
    this.onStatsUpdate(this.gameStats)
  }
  
  start() {
    this.isPaused = false
    console.log('Game started')
  }
  
  pause() {
    this.isPaused = true
    console.log('Game paused')
  }
  
  resume() {
    this.isPaused = false
    console.log('Game resumed')
  }
  
  restart() {
    // 重置游戏状态
    this.gameStats = {
      score: 0,
      level: 1,
      gems: 0
    }
    
    // 重置英雄
    this.hero.x = 400
    this.hero.y = 300
    this.hero.speed = 3
    this.hero.targetX = this.hero.x
    this.hero.targetY = this.hero.y
    
    // 清除所有宝石
    this.gems.forEach(gem => {
      this.app.stage.removeChild(gem)
    })
    this.gems = []
    
    // 重新创建宝石
    this.createGems()
    
    this.isPaused = false
    console.log('Game restarted')
  }
  
  destroy() {
    this.isDestroyed = true
    if (this.app) {
      this.app.destroy(true, true)
    }
    console.log('Game destroyed')
  }
}