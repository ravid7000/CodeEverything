/**
 * window: 3
 * dir: right
 * current: 0
 * [1,2,3,4]
 * start = (arr.length - 1) - Math.floor(window.length / 2) + current
 *  3 - 1 - 0 => 3
 *  3 - 1 - 1 => 2 x
 *  3 - 1 - 2 => 0 x
 *  3 - 1 - 3 => -1
 *
 * repeatLeft()
 *
 * current: 4
 * dir: right
 * []
 */

import { stdout } from "../stream";

function repeatArr(arr: number[]) {
  const repeated: number[] = [];
  arr.forEach((item) => repeated.push(item));
  arr.forEach((item) => repeated.push(item));
  return repeated;
}

function isOnBoundary(len: number, current: number) {
  return current === 0 || current === len - 1;
}

function arrayRotateInfinite(
  carousel: number[],
  windowSize: number,
  current: number,
  dir: string
) {
  // increment current
  let win: number[] = [];
  let next = dir === "left" ? current - 1 : current + 1;

  let repeated = isOnBoundary(carousel.length, next)
    ? repeatArr(carousel)
    : carousel;
  let newCurrent = isOnBoundary(carousel.length, next)
    ? next + carousel.length
    : next;
  let left = newCurrent - Math.floor(windowSize / 2);
  let right = newCurrent + Math.floor(windowSize / 2) + 1;
  while (left < right) {
    win.push(repeated[left]);
    left += 1;
  }
  return win;
}

const testData = {
  carousel: [1, 2, 3, 4, 5],
  windowSize: 3,
  current: 1,
  dir: "right",
};

stdout(
  testData,
  arrayRotateInfinite(
    testData.carousel,
    testData.windowSize,
    testData.current,
    testData.dir
  )
);
