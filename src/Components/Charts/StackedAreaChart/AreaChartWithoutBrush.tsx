import React from 'react';

import { makeStyles } from "@material-ui/core";

import { ChartSize, ChartMargin, colorGray, colorsRGB, Interval2D } from "../charts.definitions";
import { useAreaChartComponents } from "../Hooks/useAreaChartComponents";
import { useZoom } from "../Hooks/BaseHooks/useZoom";

/**
 * A plain stacked area chart.
 * 
 * @param props 
 * @param lane - the data to be plotted as an array of datapoints ( Datapoint[] )
 * @param size - the size of the sub-chart (including margins) in svg units.
 * @param margin
 */
export function AreaChartWithoutBrush(props: {
  data: number[][],
  size: ChartSize,
  margin: ChartMargin,
}) {

  const data = props.data;
  const margin: ChartMargin = props.margin;
  const size: ChartSize = props.size;

  // Get the chart axis and content
  const colors = (data[0].length === 1) ? colorGray : colorsRGB;
  const keys = data[0].map((v, i) => i); // The keys are the indexes.
  const [x, y, stack] = useAreaChartComponents<number[], number>(
    data,
    keys,
    size,
    margin,
    colors,
  )

  // Setup the zoom behavior
  const [zoomRef,] = useZoom(
    [[0, 0], [size.width, size.height]],
    {
      x: x.fullScale,
      y: y.fullScale
    },
    {
      x: x.dataDomainSelection,
      y: y.dataDomainSelection
    },
    {
      axis: updateXScaleAndAxis,
      stack: stack.update,
    },
    [1, 5],
    false
  )

  const classes = areaChartStyles();
  return (
    <div>
      <svg
        ref={zoomRef}
        className={classes.block}
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <g transform={"translate(" + margin.left + "," + margin.top + ")"}>
          {x.axisElement}
          {y.axisElement}
          {stack.element}
        </g>
      </svg>
    </div>
  )

  /**
   * Converts the axis callback, which uses a single dimension,
   * into something that can be handled by the zoom hook, which uses both dimensions.
   * 
   * @param newDataDomainSelection 
   * @param animate 
   * @param animationLength 
   */
  function updateXScaleAndAxis(newDataDomainSelection: Interval2D,
    animate?: boolean, animationLength?: number
  ) {
    x.update(newDataDomainSelection.x, animate, animationLength)
  }

}

const areaChartStyles = makeStyles(theme => ({
  block: {
    display: "block",
  }
}));