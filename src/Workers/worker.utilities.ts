import { Image } from 'image-js'
import { encode } from 'fast-png'
import { filterOptions } from '../definitions';

/**
 * Applies a threshold and normalizes an image.
 * Returns new modified image.
 * 
 * @param image
 * @param threshold the size of the threshold as fraction of the maximum [0 to 1]
 * @param normalization whether the image should be normalized
 */
export function applyThresholdAndNormalizeImage(
  image: Image,
  threshold: number,
  normalization: boolean
) {

  if (threshold < 0 || threshold > 1) {
    throw new Error("Threshold should be between 0 and 1.")
  }

  let newImage = image.clone();

  if (normalization) {
    newImage = applyBoth(newImage, threshold)
  } else {
    newImage = applyThreshold(newImage, threshold);
  }

  return newImage;

  /**
  * Applies the threshold cutoff to the image.
  * Modifies the input image.
  * 
  * @param image
  * @param threshold - the size of the threshold as fraction of the maximum [0 to 1]
  */
  function applyThreshold(image: Image, threshold: number) {

    let runningPixel: number[];
    const trueThreshold = threshold * image.maxValue;

    for (let i = 0; i < image.width; i++) {
      for (let j = 0; j < image.height; j++) {

        runningPixel = image.getPixelXY(i, j);

        for (let c = 0; c < image.components; c++) {
          if (runningPixel[c] < trueThreshold) runningPixel[c] = 0;
        }

        image.setPixelXY(i, j, runningPixel);
      }
    }
    return image;
  }

  /**
  * Applies the threshold cutoff and normalizes the image.
  * Modifies the input image.
  * 
  * @param image
  * @param threshold - the size of the threshold as fraction of the maximum [0 to 1]
  */
  function applyBoth(image: Image, threshold: number) {
    /** The value that will be mapped to 0 in the new normalized image. */
    const min = getTrueMin(image, threshold);
    /** The highest value among all channels in the entire image. */
    const max = Math.max(...newImage.getMax());
    /** 
     * Represents how much the range of actual values will need to be
     * stretched to fill the entire domain available.
     * 
     * The image will be stretched from [min, max] to [0, 2^bitDepth]
     * We divide by the current occupied range of values to normalize it,
     * then we multiply by the full range of values we want to fill.
     */
    const scaling = image.maxValue / (max - min);
    /**
     * Represents how much the range of values should be shifted toward 0 
     * before scaling it back up.
     */
    const shift = min;

    let runningPixel: number[];
    for (let i = 0; i < image.width; i++) {
      for (let j = 0; j < image.height; j++) {

        runningPixel = image.getPixelXY(i, j);

        for (let c = 0; c < image.components; c++) {
          runningPixel[c] = (runningPixel[c] - shift) * scaling;
          if (runningPixel[c] < 0) runningPixel[c] = 0
        }

        image.setPixelXY(i, j, runningPixel);
      }
    }
    return image;
  }

  /**
   * Finds the minimum value in the image that is above the threshold.
   * 
   * This custom minimum function is needed because the threshold cutoff
   * might happen in the middle of a range with no values. In that case
   * ```Math.max(imageMinValue, threshold)``` would result in mapping the threshold
   * to 0, which is wrong because once the values lower than the treshold are
   * removed the new minimum is actually *above* the threshold, and should be used 
   * instead.
   * @param image 
   * @param threshold 
   */
  function getTrueMin(image: Image, threshold: number) {

    const trueThreshold = threshold * image.maxValue;
    let trueMin: number[] = new Array(image.channels).fill(+Infinity);

    let runningPixel: number[];
    let runningValue: number;
    for (let i = 0; i < image.width; i++) {
      for (let j = 0; j < image.height; j++) {

        runningPixel = image.getPixelXY(i, j);

        for (let c = 0; c < image.components; c++) {
          runningValue = runningPixel[c];
          if (runningValue >= trueThreshold && runningValue < trueMin[c]) {
            trueMin[c] = runningValue;
          }
        }

      }
    }

    return Math.min(...trueMin);
  }
}

/**
 * A function that extracts a histogram from a vertical section of an image.
 * Each value is the sum of the corresponding horizontal values.
 * 
 * @param image 
 * @param range the vertical section of the image to be included in the histogram.
 */
export function extractHistogram(
  image: Image,
  range: number[],
  selectedChannels: boolean[]
): number[][] {

  const width = image.width;
  const height = image.height;
  const max = image.maxValue;

  const numberOfActiveChannels = selectedChannels.filter(Boolean).length;
  const normalizationFactor = (max * (range[1] - range[0]) * numberOfActiveChannels)

  if (range[0] < 0 || range[0] >= range[1] || range[1] >= width) {
    throw new Error("Invalid range.")
  }

  const histogram: number[][] = new Array<number[]>(height);

  let runningPixel: number[];
  let runningBin: number[]
  for (let i = 0; i < height; i++) {

    histogram[i] = new Array(selectedChannels.length).fill(0);
    runningBin = histogram[i];

    for (let j = range[0]; j < range[1]; j++) {

      runningPixel = image.getPixelXY(j, i);

      for (let k = 0; k < image.components; k++) {

        if (selectedChannels[k]) {
          runningBin[k] += runningPixel[k] / normalizationFactor;
        }
      }
    }
  }

  return histogram
}

/**
 * First encodes a "image/png" from the image data, then converts the
 * data array into a blob, which is finally made accessible through a URL.
 * 
 * Remember to revoke the URL when done to avoid a memory leak.
 * 
 * @param image 
 */
export function convertToURL(image: Image): string {
  const dataArray = encodePNG(image);
  const dataBlob = PNGdataArrayToBlob(dataArray);
  const newURL = URL.createObjectURL(dataBlob)
  return newURL;

  /**
   * Uses fast-png to encode the image into a data array.
   * Does not maintain high bit depth.
   * @param image 
   */
  function encodePNG(image: Image): Uint8Array {

    const data = {
      width: image.width,
      height: image.height,
      components: image.components,
      channels: image.channels,
      alpha: image.alpha,
      bitDepth: image.bitDepth,
      data: image.data as Uint8Array | Uint16Array,
    };


    if (data.bitDepth === 1 || data.bitDepth === 32) {
      data.bitDepth = 8;
      data.components = 3;
      data.alpha = 1;
      data.data = image.getRGBAData() as Uint8Array;
    }

    return encode(data);
  }

  /**
   * Converts a data array to a "image/png" blob.
   * @param dataArray 
   */
  function PNGdataArrayToBlob(dataArray: Uint8Array) {
    return new Blob([dataArray], { type: "image/png" })
  }
}

/**
 * Generates and returns a new grey image while allowing to include only some channels.
 * @param image 
 * @param selectedChannels 
 */
export function getGreyImage(image: Image, selectedChannels: boolean[]) {

  if (image.components === 1) return image;

  const combineMethod = (pixel: number[], c: boolean[] = selectedChannels) => {
    let value: number = 0;
    for (let i = 0; i < c.length; i++) {
      if (c[i]) value += pixel[i];
    }
    value /= selectedChannels.filter(Boolean).length;
    return value
  }

  return image.combineChannels(
    combineMethod,
    { keepAlpha: false, mergeAlpha: false }
  )
}

/**
 * Applies the indicated filters to the image.
 * 
 * Currently filters are disabled because of the high computational cost for
 * relatively little gain.
 * 
 * @param image 
 * @param filters 
 * @param selectedChannels 
 */
export function applyFilters(
  image: Image,
  filters: filterOptions[],
  selectedChannels: boolean[]
) {

  for (const filter of filters) {
    switch (filter) {

      // Median Filter
      case 1:
        const selectedChannelsByIndex: number[] = selectedChannels
          .map((isSelected, i) => (isSelected) ? i : null)
          .filter(value => value !== null) as number[];

        const medianFilterOptions = {
          channels: selectedChannelsByIndex,
          radius: 3,
        };

        image = image.medianFilter(medianFilterOptions);
        break;

      default:
        break;
    }
  }
  return image;
}