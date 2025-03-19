import Three from './experience'
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
})
