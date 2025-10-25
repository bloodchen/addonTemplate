<template>
  <div></div>
</template>

<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'GotoView',
  props: {
    to: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const router = useRouter()
    
    onMounted(() => {
      processRedirect()
    })
    
    const processRedirect = async () => {
      try {
        // 验证参数
        if (!props.to) {
          // 没有参数时跳转到首页
          router.push('/')
          return
        }
        
        // 检查是否为内部路由跳转
        if (props.to === 'game') {
          // 内部跳转到游戏页面
          router.push('/')
          return
        }
        
        // 解码URL
        let decodedUrl = decodeURIComponent(props.to)
        
        // 验证URL格式
        if (!isValidUrl(decodedUrl)) {
          // 无效URL时跳转到首页
          router.push('/')
          return
        }
        
        // 安全检查 - 只允许http和https协议
        const url = new URL(decodedUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          // 不安全协议时跳转到首页
          router.push('/')
          return
        }
        
        // 执行外部跳转
        window.location.href = decodedUrl
        
      } catch (err) {
        console.error('Redirect processing error:', err)
        // 出错时跳转到首页
        router.push('/')
      }
    }
    
    const isValidUrl = (string) => {
      try {
        new URL(string)
        return true
      } catch (_) {
        return false
      }
    }
    
    return {}
  }
}
</script>

<style scoped>
/* 空样式 */
</style>