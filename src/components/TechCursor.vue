<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

// 鼠标位置状态
const cursor = ref(null)
const cursorTrail = ref(null)
const cursorDot = ref(null)

// 鼠标位置
let mouseX = 0
let mouseY = 0
let cursorX = 0
let cursorY = 0
let trailX = 0
let trailY = 0

// 动画帧ID
let animationFrameId = null

// 鼠标移动事件处理
function handleMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY

  // 检查是否在Three.js画布上
  const target = e.target
  if (target && target.classList.contains('three-canvas')) {
    if (cursor.value)
      cursor.value.style.opacity = '0'
    if (cursorTrail.value)
      cursorTrail.value.style.opacity = '0'
    if (cursorDot.value)
      cursorDot.value.style.opacity = '0'
    return
  }

  // 显示光标
  if (cursor.value)
    cursor.value.style.opacity = '1'
  if (cursorTrail.value)
    cursorTrail.value.style.opacity = '1'
  if (cursorDot.value)
    cursorDot.value.style.opacity = '1'

  // 检查是否悬停在可交互元素上
  const isHovering = target?.closest('.nav-button')
    || target?.closest('.social-button')
    || target?.closest('.logo-text')

  if (isHovering) {
    if (cursor.value) {
      cursor.value.style.width = '80px'
      cursor.value.style.height = '80px'
    }
    if (cursorTrail.value) {
      cursorTrail.value.style.width = '50px'
      cursorTrail.value.style.height = '50px'
    }
    if (cursorDot.value) {
      cursorDot.value.style.width = '12px'
      cursorDot.value.style.height = '12px'
    }
  }
  else {
    if (cursor.value) {
      cursor.value.style.width = '60px'
      cursor.value.style.height = '60px'
    }
    if (cursorTrail.value) {
      cursorTrail.value.style.width = '40px'
      cursorTrail.value.style.height = '40px'
    }
    if (cursorDot.value) {
      cursorDot.value.style.width = '8px'
      cursorDot.value.style.height = '8px'
    }
  }
}

// 鼠标离开页面
function handleMouseLeave() {
  if (cursor.value)
    cursor.value.style.opacity = '0'
  if (cursorTrail.value)
    cursorTrail.value.style.opacity = '0'
  if (cursorDot.value)
    cursorDot.value.style.opacity = '0'
}

// 鼠标进入页面
function handleMouseEnter() {
  if (cursor.value)
    cursor.value.style.opacity = '1'
  if (cursorTrail.value)
    cursorTrail.value.style.opacity = '1'
  if (cursorDot.value)
    cursorDot.value.style.opacity = '1'
}

// 动画循环
function animate() {
  // 平滑跟随鼠标位置
  cursorX += (mouseX - cursorX) * 0.15
  cursorY += (mouseY - cursorY) * 0.15

  trailX += (cursorX - trailX) * 0.1
  trailY += (cursorY - trailY) * 0.1

  // 更新光标位置
  if (cursor.value) {
    cursor.value.style.left = `${cursorX}px`
    cursor.value.style.top = `${cursorY}px`
  }

  if (cursorTrail.value) {
    cursorTrail.value.style.left = `${trailX}px`
    cursorTrail.value.style.top = `${trailY}px`
  }

  if (cursorDot.value) {
    cursorDot.value.style.left = `${mouseX}px`
    cursorDot.value.style.top = `${mouseY}px`
  }

  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  // 绑定事件
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('mouseenter', handleMouseEnter)

  // 开始动画
  animate()
})

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  window.removeEventListener('mouseenter', handleMouseEnter)

  // 取消动画帧
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="tech-cursor-container">
    <!-- 外层光晕光标 -->
    <div
      ref="cursor"
      class="cursor-outer"
    />

    <!-- 中层轨迹光标 -->
    <div
      ref="cursorTrail"
      class="cursor-trail"
    />

    <!-- 内层点光标 -->
    <div
      ref="cursorDot"
      class="cursor-dot"
    />
  </div>
</template>

<style scoped>
.tech-cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  mix-blend-mode: screen;
}

/* 外层光晕光标 - 大光环 */
.cursor-outer {
  position: fixed;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(168, 85, 247, 0.6);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
  box-shadow:
    0 0 20px rgba(168, 85, 247, 0.5),
    0 0 40px rgba(139, 92, 246, 0.3),
    inset 0 0 20px rgba(168, 85, 247, 0.2);
  opacity: 0;
  z-index: 99998;
}

/* 添加旋转动画 */
.cursor-outer::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid transparent;
  border-top-color: rgba(168, 85, 247, 0.8);
  border-right-color: rgba(192, 132, 252, 0.6);
  border-radius: 50%;
  animation: cursorRotate 3s linear infinite;
}

.cursor-outer::after {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 1px solid transparent;
  border-bottom-color: rgba(139, 92, 246, 0.8);
  border-left-color: rgba(168, 85, 247, 0.6);
  border-radius: 50%;
  animation: cursorRotate 2s linear infinite reverse;
}

/* 中层轨迹光标 - 中等光环 */
.cursor-trail {
  position: fixed;
  width: 40px;
  height: 40px;
  border: 1.5px solid rgba(192, 132, 252, 0.7);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
  box-shadow:
    0 0 15px rgba(192, 132, 252, 0.4),
    0 0 30px rgba(168, 85, 247, 0.2),
    inset 0 0 15px rgba(192, 132, 252, 0.15);
  opacity: 0;
  z-index: 99997;
}

/* 内层点光标 - 小光点 */
.cursor-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(192, 132, 252, 0.8) 50%,
    rgba(168, 85, 247, 0.6) 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease;
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(192, 132, 252, 0.6),
    0 0 30px rgba(168, 85, 247, 0.4);
  opacity: 0;
  z-index: 99999;
}

/* 悬停在可交互元素上时的效果 */
.cursor-outer {
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, border-color 0.3s ease;
}

.cursor-trail {
  transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
}

.cursor-dot {
  transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease;
}

/* 旋转动画 */
@keyframes cursorRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cursor-outer {
    width: 40px;
    height: 40px;
  }

  .cursor-trail {
    width: 30px;
    height: 30px;
  }

  .cursor-dot {
    width: 6px;
    height: 6px;
  }
}

/* 隐藏默认光标 */
:global(body) {
  cursor: none !important;
}

:global(.three-canvas) {
  cursor: auto !important;
}
</style>
