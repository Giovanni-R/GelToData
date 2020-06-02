import { useRef } from 'react';

import { ChartSize, ChartMargin, ScaleAndAxis, Stack, K, D } from '../charts.definitions';
import { getInnerChartSize } from '../charts.utilities';
import { useAxis } from './BaseHooks/useAxis';
import { useAreaStack } from './BaseHooks/useAreaStack';

/**
 * This hook generates the components of a (stacked) area chart [xAxis, yAxis, stack]
 * 
 * @param data - Datapoint[]
 * @param keys - These are the access properites of each datapoint ([0, 1, 2, ...] for arrays)
 * @param size - the size of the chart (including margins) in svg units.
 * @param margin 
 * @param colors - These will be mapped to the keys
 * 
 * @returns x - which contains the {axisElement, selectedDataDomain, fullScale, updateFunction}
 * @returns y - which contains the {axisElement, selectedDataDomain, fullScale, updateFunction}
 * @returns stack - which contains the {stackElement, updateFunction}
 */
export function useAreaChartComponents<Datum extends D<Key>, Key extends K>(
  data: Datum[],
  keys: Key[],
  size: ChartSize,
  margin: ChartMargin,
  colors?: string[],
): [
    ScaleAndAxis,
    ScaleAndAxis,
    Stack,
  ] {

  const [xSize, ySize] = getInnerChartSize(size, margin)

  const xFullDataDomain = [0, data.length - 1] as [number, number]
  const xDataDomainSelectionRef = useRef(xFullDataDomain)
  const xFullPixelRange = [0, xSize] as [number, number]
  const [xAxis, xUpdateScaleAndAxis, xFullScale] = useAxis(
    xFullDataDomain,
    xDataDomainSelectionRef.current,
    xFullPixelRange,
    "bottom",
    size,
    margin,
    5,
  )

  const yFullDataDomain = [0, 1] as [number, number]
  const yDataDomainSelectionRef = useRef(yFullDataDomain)
  const yFullPixelRange = [ySize, 0] as [number, number]
  const [yAxis, yUpdateScaleAndAxis, yFullScale] = useAxis(
    yFullDataDomain,
    yDataDomainSelectionRef.current,
    yFullPixelRange,
    "left",
    size,
    margin,
    3,
  )

  const [stackElem, updateStack] = useAreaStack<Datum, Key>(
    data,
    keys,
    {
      x: xFullScale,
      y: yFullScale,
    },
    colors,
  )

  const x: ScaleAndAxis = {
    axisElement: xAxis,
    dataDomainSelection: xDataDomainSelectionRef,
    fullScale: xFullScale,
    update: xUpdateScaleAndAxis,
  }

  const y: ScaleAndAxis = {
    axisElement: yAxis,
    dataDomainSelection: yDataDomainSelectionRef,
    fullScale: yFullScale,
    update: yUpdateScaleAndAxis,
  }

  const stack: Stack = {
    element: stackElem,
    update: updateStack,
  }

  return [x, y, stack]

}