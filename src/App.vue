<script setup>
import { onMounted, ref } from 'vue'
import Experience from './js/experience.js'

const threeCanvas = ref(null)

onMounted(() => {
  // 初始化 three.js 场景
  const _experience = new Experience(threeCanvas.value)
  // 存储实例供后续使用
  window._threeExperience = _experience
})
</script>

<template>
  <div class="min-h-screen w-full relative bg-black" style="pointer-events: none;">
    <!-- three.js 渲染的 canvas -->
    <canvas ref="threeCanvas" class="three-canvas relative inset-0 z-0 " style="pointer-events: auto;" />

    <!-- Indigo Cosmos Background with Top Glow -->
    <div
      class="absolute inset-0 z-[1]"
      style="background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%), rgba(0, 0, 0, 0.1) ;pointer-events: none;"
    />

    <!-- 标题区域 - 底部呼吸灯之上 -->
    <div class="title-container">
      <!-- 科技感装饰元素 -->
      <div class="tech-decorations">
        <!-- 左侧电路线 -->
        <div class="tech-line tech-line-left" />
        <!-- 右侧电路线 -->
        <div class="tech-line tech-line-right" />
      </div>

      <h1 class="main-title">
        MAESTROM
      </h1>
      <h2 class="sub-title">
        Explorateur Cosmique
      </h2>
    </div>

    <!-- 呼吸灯效果 - 底部10%位置 -->
    <div class="breathing-container">
      <!-- 环境光晕 -->
      <div class="ambient-glow" />

      <!-- 主呼吸灯 -->
      <div class="breathing-light" />
    </div>
  </div>
</template>

<style scoped>
.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 标题容器 - 定位到呼吸灯之上 */
.title-container {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  pointer-events: none;
}

/* 科技感装饰容器 */
.tech-decorations {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 200px;
  pointer-events: none;
}

/* 科技线条 */
.tech-line {
  position: absolute;
  top: 115%;
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(168, 85, 247, 0.8) 50%,
    transparent 100%);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

.tech-line-left {
  animation: techLineLeft 4s ease-in-out infinite;
}

.tech-line-right {
  right: 0px;
  animation: techLineRight 4s ease-in-out infinite;
}

/* 主标题样式 - 科技感动效 */
.main-title {
  font-family: "Orbitron", sans-serif;
  font-size: 6rem;
  font-weight: 550;
  letter-spacing: 0.25em;
  margin: 0 0 0.5rem 0;
  color: transparent;
  position: relative;
  -webkit-text-stroke: 2px rgba(168, 85, 247, 0.1);
  text-shadow:0 0 2px rgba(146,112,226,0),0 0 15px rgba(168, 82, 221, 0.59),0 0 14px rgba(0,0,0,.37),0 0 21px rgba(163,126,248,.19);
  animation:
    techGlow 4s ease-in-out infinite,
    techFlicker 6s linear infinite,
    techPulse 2s ease-in-out infinite alternate;
  overflow: hidden;
}

/* 主标题扫描线效果 */
.main-title::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -50px;
  right: -50px;
  height: 4px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(168, 85, 247, 0.3) 20%,
    rgba(168, 85, 247, 1) 50%,
    rgba(168, 85, 247, 0.3) 80%,
    transparent 100%);
  box-shadow:
    0 0 10px rgba(168, 85, 247, 0.8),
    0 0 20px rgba(139, 92, 246, 0.4),
    0 0 30px rgba(192, 132, 252, 0.2);
  animation: scanLine 3s linear infinite;
  z-index: 1;
}

/* 主标题外层白色描边 */
.main-title::after {
  content: 'MAESTROM';
  position: absolute;
  top: 0;
  left: 0;
  font-family: "Orbitron", sans-serif;
  font-size: 6rem;
  font-weight: 550;
  letter-spacing: 0.25em;
  color: transparent;
  -webkit-text-stroke: 6px rgba(255, 255, 255, 0.952);
  z-index: -2;
  animation: outerWhiteStroke 3s ease-in-out infinite;
}

/* 副标题样式 */
.sub-title {
  font-family: "Orbitron", sans-serif;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
  font-size: 3.5rem;
  letter-spacing: 0.05em;
  margin: 0;
  background: linear-gradient(180deg, #fff, #eccbf5 50%, #dc78f8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 1px rgba(255, 255, 255, 0.6),
    0 0 2px rgba(255, 255, 255, 0.4),
    0 0 3px rgba(255, 255, 255, 0.2),
    0 0 4px rgba(200, 191, 211, 0.2);
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.6);
  animation: subtitleGlow 3s ease-in-out infinite;
}

/* 呼吸灯容器 - 定位到底部10% */
.breathing-container {
  position: absolute;
  bottom: 2%;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 60px;
  z-index: 10;
  pointer-events: none;
}

/* 主呼吸灯 */
.breathing-light {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 2px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(139, 92, 246, 0.3) 15%,
      rgba(139, 92, 246, 0.8) 25%,
      rgba(168, 85, 247, 1) 40%,
      rgba(192, 132, 252, 1) 50%,
      rgba(168, 85, 247, 1) 60%,
      rgba(139, 92, 246, 0.8) 75%,
      rgba(139, 92, 246, 0.3) 85%,
      transparent 100%);
  animation: breathe 3s ease-in-out infinite;
  clip-path: ellipse(200px 2px at center);
}

/* 外层光晕 */
.breathing-light::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 20px;
  background: radial-gradient(ellipse,
      rgba(168, 85, 247, 0.4) 0%,
      rgba(139, 92, 246, 0.25) 30%,
      rgba(124, 58, 237, 0.1) 60%,
      transparent 100%);
  border-radius: 50px;
  animation: breatheGlow 3s ease-in-out infinite;
  filter: blur(8px);
}

/* 内层高光 */
.breathing-light::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 15%,
      rgba(255, 255, 255, 0.6) 25%,
      rgba(255, 255, 255, 1) 50%,
      rgba(255, 255, 255, 0.6) 75%,
      rgba(255, 255, 255, 0.2) 85%,
      transparent 100%);
  border-radius: 1px;
  animation: breatheCore 3s ease-in-out infinite;
  filter: blur(1px);
  clip-path: ellipse(100px 1px at center);
}

/* 环境光晕 */
.ambient-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 40px;
  background: radial-gradient(ellipse,
      rgba(139, 92, 246, 0.08) 0%,
      rgba(159, 61, 250, 0.15) 10%,
      rgba(88, 28, 135, 0.02) 70%,
      transparent 100%);
  border-radius: 50%;
  animation: ambientBreathe 3s ease-in-out infinite;
  filter: blur(20px);
}

/* 科技感动画定义 */
@keyframes techGlow {
  0%, 100% {
    text-shadow:
      0 0 2px rgba(146,112,226,0),
      0 0 15px rgba(168, 82, 221, 0.59),
      0 0 14px rgba(0,0,0,.37),
      0 0 21px rgba(163,126,248,.19);
    filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.4));
  }
  25% {
    text-shadow:
      0 0 5px rgba(192, 132, 252, 0.3),
      0 0 20px rgba(168, 82, 221, 0.8),
      0 0 14px rgba(0,0,0,.37),
      0 0 30px rgba(139, 92, 246, 0.4);
    filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6));
  }
  50% {
    text-shadow:
      0 0 8px rgba(192, 132, 252, 0.5),
      0 0 25px rgba(168, 82, 221, 1),
      0 0 14px rgba(0,0,0,.37),
      0 0 40px rgba(139, 92, 246, 0.6);
    filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.8));
  }
  75% {
    text-shadow:
      0 0 5px rgba(192, 132, 252, 0.3),
      0 0 20px rgba(168, 82, 221, 0.8),
      0 0 14px rgba(0,0,0,.37),
      0 0 30px rgba(139, 92, 246, 0.4);
    filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6));
  }
}

@keyframes techFlicker {
  0%, 90%, 100% { opacity: 1; }
  91%, 94%, 96%, 98% { opacity: 0.7; }
  92%, 95%, 97%, 99% { opacity: 1; }
}

@keyframes techPulse {
  0% {
    -webkit-text-stroke-width: 2px;
    letter-spacing: 0.25em;
  }
  100% {
    -webkit-text-stroke-width: 3px;
    letter-spacing: 0.28em;
  }
}

@keyframes scanLine {
  0% {
    top: -10px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 120px;
    opacity: 0;
  }
}

@keyframes techLineLeft {
  0%, 100% {
    transform: translateX(-100px);
    opacity: 0.3;
  }
  50% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes techLineRight {
  0%, 100% {
    transform: translateX(100px);
    opacity: 0.3;
  }
  50% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 动画定义 */
@keyframes breathe {

  0%,
  100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scaleX(0.8) scaleY(1.0);
    filter: brightness(0.7);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1.2) scaleY(1.5);
    filter: brightness(1.3);
  }
}

@keyframes breatheGlow {

  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(0.8);
  }

  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.3);
  }
}

@keyframes breatheCore {

  0%,
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scaleX(0.7) scaleY(0.5);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1.1) scaleY(1.2);
  }
}

@keyframes ambientBreathe {

  0%,
  100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.9);
  }

  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes float {

  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }

  50% {
    opacity: 0.6;
    transform: translateY(-20px) scale(1);
  }
}

/* 副标题发光动画 */
@keyframes subtitleGlow {

  0%,
  100% {
    text-shadow:
      0 0 2px rgba(242, 135, 252, 0.2),
      0 0 4px rgba(242, 255, 255, 0.4),
      0 0 6px rgba(255, 255, 255, 0.2),
      0 0 8px rgba(200, 191, 211, 0.2);
    filter: brightness(1);
  }

  50% {
    text-shadow:
      0 0 2px rgba(255, 255, 255, 0.8),
      0 0 4px rgba(255, 255, 255, 0.6),
      0 0 6px rgba(255, 255, 255, 0.4),
      0 0 8px rgba(200, 191, 211, 0.3);
    filter: brightness(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-container {
    bottom: 12%;
  }

  .main-title {
    font-size: 2.5rem;
    letter-spacing: 0.15em;
    -webkit-text-stroke: 0.8px rgba(255, 255, 255, 0.8);
  }

  .tech-decorations {
    width: 100%;
    height: 150px;
    top: -60px;
  }

  .tech-line {
    width: 150px;
  }

  .tech-line-left {
    left: -180px;
  }

  .tech-line-right {
    right: -180px;
  }

  .sub-title {
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    -webkit-text-stroke: 0.4px rgba(255, 255, 255, 0.6);
  }

  .breathing-container {
    width: 300px;
    bottom: 8%;
  }

  .breathing-light {
    width: 300px;
    height: 2px;
  }

  .breathing-light::before {
    width: 250px;
    height: 16px;
  }

  .breathing-light::after {
    width: 150px;
    height: 1px;
  }

  .ambient-glow {
    width: 300px;
    height: 30px;
  }
}

@media (max-width: 480px) {
  .title-container {
    bottom: 10%;
  }

  .main-title {
    font-size: 2rem;
    letter-spacing: 0.1em;
    margin: 0 0 0.3rem 0;
    -webkit-text-stroke: 0.6px rgba(255, 255, 255, 0.8);
  }

  .tech-decorations {
    width: 90%;
    height: 120px;
    top: -50px;
  }

  .tech-line {
    width: 120px;
  }

  .tech-line-left {
    left: -150px;
  }

  .tech-line-right {
    right: -150px;
  }

  .sub-title {
    font-size: 1rem;
    letter-spacing: 0.08em;
    -webkit-text-stroke: 0.3px rgba(255, 255, 255, 0.6);
  }

  .breathing-container {
    width: 250px;
    bottom: 6%;
  }

  .breathing-light {
    width: 250px;
  }

  .breathing-light::before {
    width: 200px;
    height: 14px;
  }

  .breathing-light::after {
    width: 120px;
  }

  .ambient-glow {
    width: 250px;
    height: 25px;
  }
}
</style>
