import "@testing-library/jest-dom/extend-expect";
import { Image } from "image-js";
import { applyThresholdAndNormalizeImage, extractHistogram } from '../Workers/worker.utilities';

/**
 * A very simple test to the function's output
 */
test('ONE: checks that applyThresholdAndNormalizeImage works as expected', async () => {
  const imageArray = new Uint8ClampedArray(
    [ // 6 x 5
      [0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50],
      [100, 100, 100, 100, 100, 100],
      [150, 150, 150, 150, 150, 150],
      [255, 255, 255, 255, 255, 255],
      // @ts-ignore
    ].flat()
  )
  const image = new Image({ data: imageArray, width: 6, height: 5, components: 1, alpha: 0 })
  const processedImage = applyThresholdAndNormalizeImage(image, 0.5, false);
  expect(processedImage.getPixelXY(0, 0)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 1)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 2)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 3)).toEqual([150]);
  expect(processedImage.getPixelXY(0, 4)).toEqual([255]);
});

/**
 * A very simple test to the function's output
 */
test('TWO: checks that applyThresholdAndNormalizeImage works as expected', async () => {
  const imageArray = new Uint8ClampedArray(
    [ // 6 x 5
      [0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50],
      [100, 100, 100, 100, 100, 100],
      [150, 150, 150, 150, 150, 150],
      [255, 255, 255, 255, 255, 255],
      // @ts-ignore
    ].flat()
  )
  const image = new Image({ data: imageArray, width: 6, height: 5, components: 1, alpha: 0 })
  let processedImage = applyThresholdAndNormalizeImage(image, 0.5, true);
  expect(processedImage.getPixelXY(0, 0)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 1)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 2)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 3)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 4)).toEqual([255]);
});

/**
 * A very simple test to the function's output
 */
test('THREE: checks that applyThresholdAndNormalizeImage works as expected', async () => {
  const imageArray = new Uint8ClampedArray(
    [ // 6 x 5
      [0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50],
      [100, 100, 100, 100, 100, 100],
      [150, 150, 150, 150, 150, 150],
      [255, 255, 255, 255, 255, 255],
      // @ts-ignore
    ].flat()
  )
  const image = new Image({ data: imageArray, width: 6, height: 5, components: 1, alpha: 0 })
  let processedImage = applyThresholdAndNormalizeImage(image, 0.3, true);
  expect(processedImage.getPixelXY(0, 0)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 1)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 2)).toEqual([0]);
  expect(processedImage.getPixelXY(0, 3)).toEqual([82]);
  expect(processedImage.getPixelXY(0, 4)).toEqual([255]);
});


/**
 * A very simple test to the function's output.
 * Extracts a single lane.
 */
test('FOUR: checks that extractHistogram works as expected', async () => {
  const imageArray = new Uint8ClampedArray(
    [ // 6 x 5
      [0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50],
      [100, 100, 100, 100, 100, 100],
      [150, 150, 150, 150, 150, 150],
      [255, 255, 255, 255, 255, 255],
      // @ts-ignore
    ].flat()
  )
  const image = new Image({ data: imageArray, width: 6, height: 5, components: 1, alpha: 0 })
  expect(extractHistogram(image, [0, 1], [true])).toEqual(
    [[0 / 255], [50 / 255], [100 / 255], [150 / 255], [255 / 255]]);
});


/**
 * A very simple test to the function's output.
 * Extracts two lanes and checks that the output gives their average.
 */
test('FIVE: checks that extractHistogram works as expected', async () => {
  const imageArray = new Uint8ClampedArray(
    [ // 6 x 5
      [0, 10, 20, 30, 40, 50],
      [50, 60, 70, 80, 90, 100],
      [100, 100, 100, 100, 100, 100],
      [150, 150, 150, 150, 150, 150],
      [255, 255, 255, 255, 255, 255],
      // @ts-ignore
    ].flat()
  )
  const image = new Image({ data: imageArray, width: 6, height: 5, components: 1, alpha: 0 })
  expect(extractHistogram(image, [1, 3], [true])).toEqual(
    [[15 / 255], [65 / 255], [100 / 255], [150 / 255], [255 / 255]]);
});