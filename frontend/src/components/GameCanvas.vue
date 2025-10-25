<template>
  <div class="game-canvas-container">
    <div ref="gameCanvas" class="game-canvas"></div>
    <div class="game-ui">
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">{{ $t('game.score') }}:</span>
          <span class="stat-value">{{ gameStats.score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('game.level') }}:</span>
          <span class="stat-value">{{ gameStats.level }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ $t('game.gems') }}:</span>
          <span class="stat-value">{{ gameStats.gems }}</span>
        </div>
      </div>
      <div class="controls">
        <button @click="togglePause" class="control-btn">
          {{ isPaused ? $t('game.resume') : $t('game.pause') }}
        </button>
        <button @click="restartGame" class="control-btn">
          {{ $t('game.restart') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DomainHeroesGame } from '../game/DomainHeroesGame.js'

export default {
  name: 'GameCanvas',
  props: {
    sourceUrl: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const { t } = useI18n()
    const gameCanvas = ref(null)
    const game = ref(null)
    const isPaused = ref(false)
    const gameStats = ref({
      score: 0,
      level: 1,
      gems: 0
    })
    
    onMounted(() => {
      initGame()
    })
    
    onUnmounted(() => {
      if (game.value) {
        game.value.destroy()
      }
    })
    
    const initGame = () => {
      if (gameCanvas.value) {
        game.value = new DomainHeroesGame({
          container: gameCanvas.value,
          sourceUrl: props.sourceUrl,
          onStatsUpdate: (stats) => {
            gameStats.value = { ...stats }
          }
        })
        
        game.value.start()
      }
    }
    
    const togglePause = () => {
      if (game.value) {
        if (isPaused.value) {
          game.value.resume()
        } else {
          game.value.pause()
        }
        isPaused.value = !isPaused.value
      }
    }
    
    const restartGame = () => {
      if (game.value) {
        game.value.restart()
        isPaused.value = false
        gameStats.value = {
          score: 0,
          level: 1,
          gems: 0
        }
      }
    }
    
    return {
      gameCanvas,
      gameStats,
      isPaused,
      togglePause,
      restartGame
    }
  }
}
</script>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.game-canvas {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  pointer-events: none;
}

.stats {
  display: flex;
  gap: 20px;
  pointer-events: auto;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-label {
  font-weight: bold;
  margin-right: 5px;
}

.stat-value {
  color: #ffd700;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.control-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.control-btn:active {
  transform: translateY(0);
}
</style>