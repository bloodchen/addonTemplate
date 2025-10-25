<template>
  <div class="game-view">
    <div class="header">
      <h1 class="title">🏰 {{ $t('game.title') }}</h1>
      <div class="controls">
        <select v-model="currentLocale" @change="changeLanguage" class="language-selector">
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
        </select>
        <button @click="testAPI" class="test-button">测试API</button>
        <div class="source-info" v-if="sourceUrl">
          <span class="label">{{ $t('game.sourceUrl') }}:</span>
          <span class="url">{{ sourceUrl }}</span>
        </div>
      </div>
    </div>
    
    <div class="api-status" v-if="apiStatus">
      <p :class="apiStatus.type">{{ apiStatus.message }}</p>
    </div>
    
    <div class="game-container">
      <GameCanvas ref="gameCanvas" :source-url="sourceUrl" />
    </div>
    
    <div class="footer">
      <p>{{ $t('game.instructions') }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCanvas from '../components/GameCanvas.vue'
import { get } from '../utils/util.js'

export default {
  name: 'GameView',
  components: {
    GameCanvas
  },
  setup() {
    const { locale } = useI18n()
    const currentLocale = ref(locale.value)
    const sourceUrl = ref('')
    const apiStatus = ref(null)
    
    // 获取URL参数中的sourceUrl
    onMounted(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const url = urlParams.get('sourceUrl')
      if (url) {
        sourceUrl.value = decodeURIComponent(url)
      }
    })
    
    const changeLanguage = () => {
      locale.value = currentLocale.value
    }
    
    const testAPI = async () => {
      try {
        apiStatus.value = { type: 'info', message: '正在测试API连接...' }
        
        // 测试根路径
        const rootResponse = await get('/')
        console.log('Root API response:', rootResponse)
        
        // 测试test路径
        const testResponse = await get('/test')
        console.log('Test API response:', testResponse)
        
        apiStatus.value = { 
          type: 'success', 
          message: `API连接成功！根路径返回: ${rootResponse}, 测试路径返回: ${testResponse}` 
        }
        
        // 3秒后清除状态
        setTimeout(() => {
          apiStatus.value = null
        }, 3000)
        
      } catch (error) {
        console.error('API test failed:', error)
        apiStatus.value = { 
          type: 'error', 
          message: `API连接失败: ${error.message}` 
        }
        
        // 5秒后清除错误状态
        setTimeout(() => {
          apiStatus.value = null
        }, 5000)
      }
    }
    
    return {
      currentLocale,
      sourceUrl,
      apiStatus,
      changeLanguage,
      testAPI
    }
  }
}
</script>

<style scoped>
.game-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.title {
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.language-selector {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.test-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(76, 175, 80, 0.9);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.test-button:hover {
  background: rgba(76, 175, 80, 1);
}

.api-status {
  padding: 10px 20px;
  text-align: center;
}

.api-status .success {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 8px 16px;
  border-radius: 4px;
}

.api-status .error {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
  padding: 8px 16px;
  border-radius: 4px;
}

.api-status .info {
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  padding: 8px 16px;
  border-radius: 4px;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.label {
  font-weight: bold;
}

.url {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.footer {
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
  font-size: 14px;
}
</style>