import React from 'react';

import { makeStyles } from '@material-ui/core';

import { ChartSize, ChartMargin, colorGray, colorsRGB, Interval2D } from '../charts.definitions';
import { useAreaChartComponents } from './useAreaChartComponents';
import { useBrush } from './BaseHooks/useBrush';

/**
 * This hook generates a separate chart with a brush in it.
 * 
 * @param data - Datapoint[]
 * @param selectedDataDomains 
 * @param size - the size of the sub-chart (including margins) in svg units
 * @param margin 
 * @param onBrushChange - a callback for when the user interacts with the brush
 * @param showAxis - useful to hide one or both axis
 * 
 * @returns brushElement - a svg element containing the chart
 * @returns setBrush - a callback useful to programmatically move the brush
 */
export function useBrushedChart(
  data: number[][],
  selectedDataDomains: Interval2D,
  size: ChartSize,
  margin: ChartMargin,
  onBrushChange: (newSelectedDomain: Interval2D) => void,
  showAxis = { x: true, y: true },
): [
    JSX.Element,
    (newDataDomainSelection: Interval2D) => void,
  ] {

  // Get the two axis, plus the chart content
  const colors = (data[0].length === 1) ? colorGray : colorsRGB;
  const keys = data[0].map((v, i) => i); // The keys are the indexes.
  const [x, y, content] = useAreaChartComponents<number[], number>(
    data,
    keys,
    size,
    margin,
    colors,
  )

  // Setup the brush behavior, the ref will need to be applied to the svg
  const [brushRef, setBrushTo] = useBrush(
    { x: x.fullScale, y: y.fullScale },
    selectedDataDomains,
    size,
    margin,
    onBrushChange,
  )

  const classes = brushStyles();
  const viewBox = `0 0 ${size.width} ${size.height}`;
  const transform = `translate( ${margin.left}, ${margin.top})`

  const svg = <svg className={classes.brush} viewBox={viewBox}>
    <g ref={brushRef} transform={transform}>

      {showAxis.x ? x.axisElement : <></>}
      {content.element}
      {showAxis.y ? y.axisElement : <></>}

    </g>
  </svg>;

  return [svg, setBrushTo];
}


const brushStyles = makeStyles(theme => ({
  brush: {
    display: "block",
  }
}));