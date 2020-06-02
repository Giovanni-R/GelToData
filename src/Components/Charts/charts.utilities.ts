import { ChartMargin, ChartSize, Interval } from "./charts.definitions";

/**
 * Computes the size of the inner portion of a chart,
 * given a total size and margins *in svg units*.
 * 
 * @param size 
 * @param margin 
 */
export function getInnerChartSize(size: ChartSize, margin: ChartMargin
): [number, number] {
  let x = size.width - margin.left - margin.right;
  let y = size.height - margin.top - margin.bottom;
  return [x, y];
}

/**
 * A small helper function to prettify the comparison of two {@Link Interval}
 * 
 * @param firstInterval 
 * @param secondInterval 
 */
export function intervalsAreEqual(firstInterval: Interval, secondInterval: Interval) {
  return (firstInterval[0] === secondInterval[0] && firstInterval[1] === secondInterval[1]);
}