import React from 'react';

import { makeStyles } from "@material-ui/core";

import { ChartSize, ChartMargin, colorsRGB, colorGray, Interval2D } from "../charts.definitions";
import { useAreaChartComponents } from "../Hooks/useAreaChartComponents";
import { useBrushedChart } from "../Hooks/useBrushedChart";
import { useZoom } from "../Hooks/BaseHooks/useZoom";

/**
 * A stacked area chart with a brush for navigation.
 * 
 * @param props 
 * @param lane - the data to be plotted as an array of datapoints ( Datapoint[] )
 * @param size - the size of the sub-chart (including margins) in svg units.
 * Note that is *does not include the brush*, which is as wide and a third as high.
 * @param margin
 */
export function AreaChartWithBrush(props: {
  data: number[][],
  size: ChartSize,
  margin: ChartMargin,
}) {

  const data = props.data;
  const margin = props.margin;
  const size = props.size;

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

  const brushMargins: ChartMargin = {
    top: 0, // margin.top,
    right: margin.right,
    bottom: margin.bottom,
    left: margin.left,
  }
  // Get the subchart with the brush
  const [brush, updateBrush] = useBrushedChart(
    data,
    {
      x: x.dataDomainSelection.current,
      y: y.dataDomainSelection.current,
    },
    { width: size.width, height: size.height / 3 },
    brushMargins,
    handleBrushInteraction,
    { x: true, y: false }
  )

  // Setup the zoom behavior
  const [zoomRef, zoomTo] = useZoom(
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
      brush: updateBrush,
    },
    [1, 5],
    true
  )

  const classes = laneChartStyles();
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
      {brush}
    </div>
  )

  /**
   * Translates a brush interaction into a zoom event.
   * 
   * Important: set the callbacks to everything except the brush
   * itself to avoid loops with the brush and zoom calling each other.
   * @param newDataDomainSelections 
   */
  function handleBrushInteraction(newDataDomainSelections: Interval2D) {
    zoomTo(newDataDomainSelections, ["axis", "stack"], true, 200);
  }

  /**
   * Converts the axis callback, which uses a single dimension,
   * into something that can be handled by the zoom hook, which uses both dimensions.
   * 
   * @param newDataDomainSelections 
   * @param animate 
   * @param animationLength 
   */
  function updateXScaleAndAxis(newDataDomainSelections: Interval2D,
    animate?: boolean, animationLength?: number
  ) {
    x.update(newDataDomainSelections.x, animate, animationLength)
  }

}

const laneChartStyles = makeStyles(theme => ({
  block: {
    display: "block",
  }
}));