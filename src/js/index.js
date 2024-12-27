import '../css/global.css';
import '../scss/global.scss';

import Three from './experience';

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
});
