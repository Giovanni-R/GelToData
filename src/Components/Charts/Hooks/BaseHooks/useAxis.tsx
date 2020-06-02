import React, { useRef, useLayoutEffect } from 'react';

import * as d3 from '../../d3-proxy.definitions';

import { getInnerChartSize } from "../../charts.utilities";
import { ChartSize, ChartMargin, AxisLocation, Interval, LinearNumericScale } from '../../charts.definitions';

/**
 * This hook generates an axis <g> element and associated utilities (scale, and update function).
 * 
 * Important: the user of the hook should make sure that the input prop `selectedDataDomain` is kept
 * up to data with respect to the values passed to the update function to avoid unexpected behavior
 * on re-render.
 * 
 * @param fullDataDomain
 * @param dataDomainSelection - the subdomain that is currently selected
 * @param pixelRange - in svg size units
 * @param location - the side of the chart the axis should be positioned at
 * @param size - the size of the chart (including margins) in svg units.
 * @param margin 
 * @param ticks - the number of ticks on the axis
 * @param nice - ensures the ends of the axis are rounded, nice numbers
 * @param defaultAnimationLength 
 * 
 * @returns axisElement - a <g> JSX.Element
 * @returns updateAxis - a function that allows another component to update the axis directly,
 * make sure the source of the selected domain agrees with the new domain in case of a re-render.
 * @returns scale - a d3 scale covering the *full* domain
 */
export function useAxis(
  fullDataDomain: Interval,
  dataDomainSelection: Interval,
  pixelRange: Interval,
  location: AxisLocation,
  size: ChartSize,
  margin: ChartMargin,
  ticks?: number,
  nice: boolean = false,
  defaultAnimationLength: number = 200,
):
  [
    JSX.Element,
    (newSelectedDataDomain: Interval, animate?: boolean, animationLength?: number) => void,
    LinearNumericScale,
  ] {

  /**
   * This Ref will keep track of the <g> element across renders.
   * It is the anchor for d3 selection.
   */
  const internalRef = useRef<SVGGElement>(null);

  /** A d3 scale mainly used as reference for the `fullPixelRange` and `fullDataDomain` */
  const fullScale = getScale(fullDataDomain, pixelRange, nice);

  /** Shifts the axis to its correct location on one of the four sides */
  const transform = getAxisTransform(location, size, margin)

  // AFTER rendering by React, d3 takes over and manipulates the <g> element appropriately.
  useLayoutEffect(() => {
    updateScaleAndAxis(dataDomainSelection, true, 0)
  }, [dataDomainSelection]);

  const g = <g ref={internalRef} transform={transform} />;

  return [g, updateScaleAndAxis, fullScale];

  /**
   * Transitions the axis to a new subsection of the dataDomain.
   * 
   * Should be called inside a *useLayoutEffect*, *useEffect*, or event handler (the internal ref
   * and the <g> element aren't bound until the first render).
   * 
   * @param newDataDomainSelection
   * @param animate defaults to false
   * @param animationLength defaults to the value used to create the axis
   */
  async function updateScaleAndAxis(newDataDomainSelection: Interval,
    animate = false, animationLength = defaultAnimationLength
  ): Promise<void> {


    const scale = getScale(newDataDomainSelection, pixelRange, nice)

    const axisGenerator = getAxisGenerator(scale, location, ticks)

    if (internalRef.current) {
      const axis = d3.select<SVGGElement, SVGGElement>(internalRef.current as SVGGElement);
      if (animate) {
        axis.transition()
          .duration(animationLength)
          .call(axisGenerator)
          .attr("font-size", "1.2em");
      } else {
        axis.call(axisGenerator)
          .attr("font-size", "1.2em");
      }
    }
  }
}

/**
 * Generates an axisGenerator given a scale and a side of the chart.
 * 
 * axisGenerator is a d3-generated function mapping a scale and options to 
 * a <g> element with everything an axis needs (ticks, numbers, etc).
 * 
 * @param scale 
 * @param location 
 * @param ticks 
 */
function getAxisGenerator(scale: LinearNumericScale, location: AxisLocation, ticks?: number,
): d3.Axis<number | { valueOf(): number }> {

  let axisGenerator: d3.Axis<number | { valueOf(): number }>;
  switch (location) {
    case "top":
      axisGenerator = d3.axisTop(scale);
      break;
    case "right":
      axisGenerator = d3.axisRight(scale);
      break;
    case "bottom":
      axisGenerator = d3.axisBottom(scale);
      break;
    case "left":
      axisGenerator = d3.axisLeft(scale);
      break;
    default:
      throw new Error(
        `Axis location should be 
        "top" | "right" | "bottom" | "left", 
        not ${location}.`)
    // break;
  }

  if (axisGenerator && ticks) {
    axisGenerator = axisGenerator.ticks(ticks);
  }
  return axisGenerator
}

/**
 * Generates the transform needed to correctly position the axis
 * on one of the four sides.
 * 
 * @param location 
 * @param size 
 * @param margin 
 */
function getAxisTransform(location: AxisLocation, size: ChartSize, margin: ChartMargin,
): string {

  const [xSize, ySize] = getInnerChartSize(size, margin);

  let transform: string;
  switch (location) {
    case "top":
      transform = "";
      break;
    case "right":
      transform = "translate(0," + xSize + ")";
      break;
    case "bottom":
      transform = "translate(0," + ySize + ")";
      break;
    case "left":
      transform = "";
      break;
    default:
      throw new Error(
        `Axis location should be 
        "top" | "right" | "bottom" | "left", 
        not ${location}.`)
    // break;
  }

  return transform
}

/**
 * Generates a scale from a dataDomain and pixelRange.
 * 
 * @param dataDomain 
 * @param pixelRange 
 * @param nice 
 */
function getScale(dataDomain: Interval, pixelRange: Interval, nice: boolean = false,
): LinearNumericScale {

  let scale = d3.scaleLinear()
    .domain(dataDomain)
    .range(pixelRange);

  if (nice) {
    scale = scale.nice();
  }

  return scale;
}
