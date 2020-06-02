import { ImageSize } from "./definitions";

/**
 * Computes the lane locations given a width and the number of lanes.
 * They are evenly spaced along the width covering a fraction of the total
 * equal to the coverage.
 * 
 * @param width The width of the gel image in pixels.
 * @param laneCount The number of lanes in which the image should be split.
 */
export function getDefaultLaneBorders(width: number, laneCount: number, coverage: number = 0.8): number[][] {
  if (coverage <= 0 || coverage >= 1) coverage = 0.8;

  const laneWidth = (coverage) * width / laneCount;
  const halfMargin = ((1 - coverage) / 2) * width / laneCount;

  let lanes: number[][] = [];
  for (let i = 0; i < laneCount; i++) {
    lanes.push([
      Math.round((2 * i + 1) * halfMargin + (i) * laneWidth),
      Math.round((2 * i + 1) * halfMargin + (i + 1) * laneWidth)
    ]);
  }

  return lanes;
}

/**
 * This function returns a data url containing a sized SVG.
 * @param size 
 * @param color 
 * @param opacity 
 */
export function getSizedSVG(size: ImageSize, color: string = "transparent", opacity: number = 1) {
  return `data:image/svg+xml,
  <svg 
    xmlns='http://www.w3.org/2000/svg'
    width="${size.width}" 
    height="${size.height}" 
    viewBox="0 0 ${size.width} ${size.height}">
      <rect x="0" y="0" width="100%" height="100%"
      style="fill:${color};stroke:${color};opacity:${opacity}" />
  </svg>`
}

/**
   * https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
   * @param blob 
   * @param filename 
   */
export function downloadBlob(blob: Blob, filename: string) {
  // Create an object URL for the blob object
  const url = URL.createObjectURL(blob);

  // Create a new anchor element
  const a = document.createElement('a');

  // Set the href and download attributes for the anchor element
  // You can optionally set other attributes like `title`, etc
  // Especially, if the anchor element will be attached to the DOM
  a.href = url;
  a.download = filename || 'download';

  // Click handler that releases the object URL after the element has been clicked
  // This is required for one-off downloads of the blob content
  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.removeEventListener('click', clickHandler);
    }, 150);
  };

  // Add the click event listener on the anchor element
  // Comment out this line if you don't want a one-off download of the blob content
  a.addEventListener('click', clickHandler, false);

  // Programmatically trigger a click on the anchor element
  // Useful if you want the download to happen automatically
  // Without attaching the anchor element to the DOM
  // Comment out this line if you don't want an automatic download of the blob content
  a.click();

  // Return the anchor element
  // Useful if you want a reference to the element
  // in order to attach it to the DOM or use it in some other way
  return a;
}