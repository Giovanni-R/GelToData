import React, { useRef, useLayoutEffect, useMemo } from 'react';

import * as d3 from '../../d3-proxy.definitions';

import { getInnerChartSize, intervalsAreEqual } from '../../charts.utilities';
import { ChartSize, ChartMargin, Interval2D, Interval, LinearNumericScale } from '../../charts.definitions';

/**
 * This hook generates a brush behavior which may be used on a component
 * by applying the returned React reference to it.
 * 
 * Important: the user of the hook should make sure that the input prop `dataDomainSelections` is kept
 * up to data with respect to the values passed to the update function to avoid unexpected behavior
 * on re-render.
 * 
 * @param fullScales - an object containing scales for both the x and y directions
 * @param dataDomainSelections - the currently selected Data Domains (2D)
 * @param size - the size of the chart (including margins) in svg units.
 * @param margin 
 * @param onBrushChange - a callback to execute when the brush detects a change.
 * 
 * @returns brushTargetRef - a React Reference that must be applied to the element of
 * interest for the brushing to be initialized
 * @returns updateBrush - a function to update the brush independdently of React renders.
 */
export function useBrush(
  fullScales: {
    x: LinearNumericScale;
    y: LinearNumericScale;
  },
  dataDomainSelections: Interval2D,
  size: ChartSize,
  margin: ChartMargin,
  onBrushChange: (newSelectedDomain: Interval2D) => void,
): [
    React.MutableRefObject<SVGGElement | null>,
    (newDataDomainSelection: Interval2D) => void
  ] {

  const [xSize,] = getInnerChartSize(size, margin);

  /**
   * This reference will be assigned to the element to be brushed by the user of the hook.
   */
  const brushTargetRef = useRef<SVGGElement>(null);

  /** The BrushBehavior */
  const brush = useMemo(() => {
    return d3.brushX<SVGGElement>()
      .extent([[0, 0.5], [xSize, size.height - margin.bottom + 0.5]])
      .on("end", brushed)
  }, [xSize, size.height, margin.bottom])

  // AFTER rendering by React, d3 takes over and setups the brush
  useLayoutEffect(() => {
    if (brushTargetRef.current) {
      d3.select<SVGGElement, SVGGElement>(brushTargetRef.current as SVGGElement)
        .call(brush)
    }
  }, [brush])

  // Set it to the selected range
  useLayoutEffect(() => {
    setBrushTo(dataDomainSelections)
  }, [dataDomainSelections, brush])

  return [brushTargetRef, setBrushTo]

  /**
   * The handler of the event fired by a change in the brush.
   */
  function brushed(): void {

    const pixelRangeSelection = d3.event.selection as (Interval | null)
    if (!pixelRangeSelection) return

    const xFullDataDomain = fullScales.x.domain() as Interval;
    const xNormalize = (xFullDataDomain[1] - xFullDataDomain[0]) / xSize;
    const newDataDomainSelections = {
      x: [pixelRangeSelection[0] * xNormalize, pixelRangeSelection[1] * xNormalize],
      y: dataDomainSelections.y
    } as Interval2D;

    // If the selection is the full domain, then make the brush disappear to
    // facilitate further selection.
    if (intervalsAreEqual(xFullDataDomain, newDataDomainSelections.x)) {
      d3.select<SVGGElement, SVGGElement>(brushTargetRef.current as SVGGElement)
        .call(brush.move, null);
    }

    onBrushChange(newDataDomainSelections)
  }

  /**
   * The callback exposed by the hook which allows the hook's user to set the brush location.
   * 
   * @param newDataDomainSelections - the newly selected Data Domains (2D)
   */
  function setBrushTo(newDataDomainSelections: Interval2D): void {

    const xPixelRangeBrushSelection = [
      fullScales.x(newDataDomainSelections.x[0]),
      fullScales.x(newDataDomainSelections.x[1])
    ] as Interval;
    const xFullPixelRange = fullScales.x.range() as Interval;

    // Disable the callback on brush movement before programmatically moving it.
    brush.on("end", null)

    // Programmatically move the brush, but only if the range is not full,
    // in which case dismiss the brush.
    if (brushTargetRef.current) {
      const brushSelection = d3.select<SVGGElement, SVGGElement>(brushTargetRef.current as SVGGElement)

      if (intervalsAreEqual(xFullPixelRange, xPixelRangeBrushSelection)) {
        brushSelection.call(brush.move, null);
      } else {
        brushSelection.call(brush.move, xPixelRangeBrushSelection);
      }
    }

    // Re-enable callback on brush movement.
    brush.on("end", brushed)
  }

}