import React, { useState } from 'react';

import { ChartSize, ChartMargin } from "../charts.definitions";
import { AreaChartWithoutBrush } from './AreaChartWithoutBrush';
import { AreaChartWithBrush } from './AreaChartWithBrush';

/**
 * A stacked area chart.
 * 
 * @param props 
 * @param lane - the data to be plotted as an array of datapoints ( Datapoint[] )
 * @param size - the size of the sub-chart (including margins) in svg units.
 * Note that is *does not include the brush*, which is as wide and a third as high.
 * @param margin
 */
export function AreaChart(props: {
  lane: number[][],
  size: ChartSize,
  margin: ChartMargin,
}) {
  const isMobile = useMobile();

  const chart = (isMobile) ?
    <AreaChartWithoutBrush data={props.lane} size={props.size} margin={props.margin} />
    :
    <AreaChartWithBrush data={props.lane} size={props.size} margin={props.margin} />

  return chart

}

/**
 * This hook keeps track of screen size and triggers a re-render when it crosses a certain size.
 * 
 * @param maxWidth the breakpoint (default = 500)
 */
function useMobile(maxWidth: number = 500) {

  const isMobileMediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);

  const [isMobile, setIsMobile] = useState(isMobileMediaQuery.matches)

  isMobileMediaQuery.addListener(() => {
    setIsMobile(isMobileMediaQuery.matches)
  })

  return isMobile
}