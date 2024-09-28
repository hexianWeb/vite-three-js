import '../css/global.css';
import '../scss/global.scss';

import Three from './three';

const chineseNumbers = [
  '零',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '百'
];

const getChineseNumber = (number_) => {
  if (number_ === 100) return '一百';
  if (number_ < 10) return chineseNumbers[number_];
  if (number_ < 20)
    return `十${number_ % 10 === 0 ? '' : chineseNumbers[number_ % 10]}`;
  const tens = Math.floor(number_ / 10);
  const ones = number_ % 10;
  return `${chineseNumbers[tens]}十${ones === 0 ? '' : chineseNumbers[ones]}`;
};

let progress = 0;
const chineseNumberDiv = document.querySelector('#chineseNumber');

const timer = setInterval(() => {
  progress += 1;
  chineseNumberDiv.textContent = getChineseNumber(progress);

  if (progress === 100) {
    clearInterval(timer);
  }
}, 100); // 每100毫秒更新一次，整个过程约10秒

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
});
