import React, { useMemo, useRef, useLayoutEffect } from 'react';

import * as d3 from '../../d3-proxy.definitions'

import { D, K, Interval2D, LinearNumericScale } from '../../charts.definitions';

type StackDatum = [number, number];

/**
 * This hook generates a (stacked) area chart <g> element.
 * It may be panned/zoomed by providing a new DataDomain to the updateArea callback
 * which will set the indicated domain to fill the available space.
 * 
 * Note that right now the y/cross value is simply set to the datapoint index.
 * 
 * @param data - Datapoint[]
 * @param keys - These are the access properites of each datapoint ([0, 1, 2, ...] for arrays)
 * @param fullScales - The scales based on the fullDataDomain (they will be used as 
 * reference for things like range and the fullDataDomain)
 * @param colors - These will be mapped to the keys
 * @param defaultAnimationLength 
 * 
 * @returns areaElement - a <g> JSX.Element
 * @returns updateArea - a function which allows for zooming and panning of the element
 */
export function useAreaStack<Datum extends D<Key>, Key extends K>(
  data: Datum[],
  keys: Key[],
  fullScales: {
    x: LinearNumericScale;
    y: LinearNumericScale;
  },
  colors?: string[],
  defaultAnimationLength: number = 200,
): [
    JSX.Element,
    (newDataDomainSelection: Interval2D, animate?: boolean, animationLength?: number) => void
  ] {

  /**
   * This Ref will keep track of the <g> element across renders.
   * It is the anchor for d3 selection.
   */
  const internalRef = useRef<SVGGElement>(null);

  /** keyToColor is a d3-generated function mapping each stack series key to its color. */
  const keyToColor = getColorScale(keys, colors);

  /** areGenerator is a d3-generated function mapping a stack series to a svg path. */
  const areaGenerator = getAreaGenerator(fullScales.x, fullScales.y);

  /** The input data reformatted by d3 to stacked values. */
  const series = useMemo(() => parseData<Datum, Key>(data, keys), [data, keys]);

  // AFTER rendering by React, d3 takes over and manipulates the <g> element appropriately.
  useLayoutEffect(() => {
    if (internalRef.current) {

      const g = d3.select<SVGGElement, SVGGElement>(internalRef.current as SVGGElement);

      g.selectAll("path")
        .data(series)
        .join("path")
        .transition()
        .duration(defaultAnimationLength)
        .attr("d", areaGenerator)
        .attr("fill", keyToColor)
        .end();
    }
  }, [series, areaGenerator, keyToColor, defaultAnimationLength]);

  const xRange = fullScales.x.range();
  const yRange = fullScales.y.range();

  const stackElement = (
    <g clipPath={`url(#mask)`}>
      <defs>
        {/* The clipPath hides any overflow */}
        <clipPath id="mask">
          <rect x={0} y={0} width={xRange[1] - xRange[0]} height={yRange[0] - yRange[1]} />
        </clipPath>
      </defs>
      {/* Note the link to the internal ref */}
      <g ref={internalRef}></g>
    </g>
  );

  return [stackElement, zoomStackTo];

  /**
   * Moves the stack to fill the available space with the selected portion of the dataDomain.
   * 
   * Should be called inside a *useLayoutEffect*, *useEffect*, or event handler (the internal ref
   * and the <g> element aren't bound until the first render).
   * 
   * @param newDataDomainSelections - the section of the DataDomain the area will be zoomed to
   * @param animate - defaults to false
   * @param animationLength - defaults to the default value used to create the axis
   */
  async function zoomStackTo(newDataDomainSelections: Interval2D,
    animate: boolean = false, animationLength = defaultAnimationLength
  ): Promise<void> {

    if (internalRef.current) {

      const stack = d3.select<SVGGElement, SVGGElement>(internalRef.current as SVGGElement);

      /**
       * The transform defines the position to which the element should shift.
       * [scaling + translation]
       */
      const transform = generateTransform(newDataDomainSelections);

      if (animate) {
        stack.transition()
          .duration(animationLength)
          .attr("transform", transform)
      } else {
        stack.attr("transform", transform)
      }
    }


  }

  /**
   * Generates the correct transform from a target subsection of the
   * fullDataDomain.
   * 
   * @param newDataDomainSelections 
   */
  function generateTransform(
    newDataDomainSelections: Interval2D,
  ): string {
    // X transform parameters (Y skipped)
    const xFullDataDomain = fullScales.x.domain();
    const xNewDataDomain = newDataDomainSelections.x;

    /** The zoom level in the X direction. */
    const xScaling = (xFullDataDomain[1] - xFullDataDomain[0]) / (xNewDataDomain[1] - xNewDataDomain[0])

    /** The amount of translation in the X direction, DataDomain units. */
    const xDataDomainShift = xNewDataDomain[0];
    /** The amount of translation in the X direction, SVG units. */
    const xPixelRangeShift = fullScales.x(xDataDomainShift)

    const transform = `scale(${xScaling}, 1) translate(${-xPixelRangeShift})`;

    return transform;
  }
}

/**
 * Generates a d3 color scale that maps the keys to colors.
 * 
 * @param keys 
 * @param colors 
 */
function getColorScale<Key extends K>(keys: Key[], colors?: string[]
): (data: StackDatum[], i: number) => string {

  // The keys can be numbers or strings, but are converted to strings for use in the color scale.
  const stringKeys = keys.map((key) => key.toString());

  let colorScale = d3.scaleOrdinal().domain(stringKeys);
  if (colors) {
    colorScale = colorScale.range(colors);
  }

  return (data: StackDatum[], i: number): string => colorScale(stringKeys[i]) as string;
}

/**
 * Generates a d3 area generator from the given scales.
 * 
 * @param xScale 
 * @param yScale
 */
function getAreaGenerator(xScale: LinearNumericScale, yScale: LinearNumericScale,
): d3.Area<StackDatum> {

  return d3.area<StackDatum>()
    .x((d, i) => xScale(i))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))

}

/**
 * Parses the data to be used with the d3 data join.
 * 
 * @param data Datapoint[]
 * @param keys
 */
function parseData<Datum extends D<Key>, Key extends K>(data: Datum[], keys: Key[]
) {
  return d3.stack<Datum, Key>()
    .keys(keys)
    .value((d, key) => d[key])(data) as StackDatum[][]
}