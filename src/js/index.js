import Three from './experience'
import GameGuide from './world/gameGuide'
import IntroDialog from './world/introDialog'
import '../css/global.css'

import '../scss/global.scss'

document.addEventListener('DOMContentLoaded', () => {})

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas')

  if (canvas) {
    new Three(document.querySelector('#canvas'))
  }

  // Initialize the intro dialog
  new IntroDialog()

  // Initialize and show game guide
  const gameGuide = new GameGuide()
  // 检查是否完成了新手指引
  if (!localStorage.getItem('hasCompletedGuide')) {
    gameGuide.showGuide()
  }
})

const toggleDebugHashDom = document.getElementById('menuButton')
toggleDebugHashDom.addEventListener('click', () => {
  toggleDebugHash()
})

function toggleDebugHash() {
  const currentHash = window.location.hash
  if (currentHash === '#debug') {
    // Remove #debug from URL
    history.pushState('', document.title, window.location.pathname + window.location.search)
  }
  else {
    // Add #debug to URL
    window.location.hash = 'debug'
  }
  window.location.reload()
}
