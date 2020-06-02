/**
 * A base type for `Key` needed to access a datapoint (`Datum`)
 */
export type K = (number | string)

/**
 * A base type for each datapoint (`Datum`),
 * should extend {@Link K} or one of its derivatives.
 */
export type D<T extends K> = {
  [k in T]: D<T>[T];
}

export type ChartSize = {
  width: number;
  height: number;
}
export type ChartMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type AxisLocation = ("top" | "right" | "bottom" | "left")

/** An interface which includes everything needed to use and update a d3 axis. */
export interface ScaleAndAxis {
  axisElement: JSX.Element,
  dataDomainSelection: React.MutableRefObject<Interval>,
  fullScale: LinearNumericScale,
  update: (newDataDomainSelection: Interval, animate?: boolean, animationLength?: number) => void,
}
/** An interface which includes everything that is needed to display and update an element. */
export interface Stack {
  element: JSX.Element,
  update: (
    newDataDomainSelections: Interval2D,
    animate?: boolean,
    animationLength?: number
  ) => void
}

/** Colors used when the image is RGB(A). */
export const colorsRGB = [
  "#800505",
  "#058005",
  "#050580",
]

/** Color used when the image is grayscale. */
export const colorGray = [
  "#616161"
]

export type Interval = [number, number];
export type Interval2D = {
  x: Interval,
  y: Interval
};
export type LinearNumericScale = d3.ScaleLinear<number, number>;