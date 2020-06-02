import React, { useRef, useLayoutEffect } from 'react';

import * as d3 from '../../d3-proxy.definitions'

import { Interval, Interval2D, LinearNumericScale } from '../../charts.definitions';
import { intervalsAreEqual } from '../../charts.utilities';

type OnZoomCallbacks = {
  [key: string]: (newDataDomainSelections: Interval2D, animate?: boolean, animationLength?: number, rest?: any) => void,
}
type ZoomOptions = {
  animate?: boolean,
  animationLength?: number,
}

/**
 * This hook generates a zoom behavior and applies it to the SVG element 
 * that the returned reference is applied to.
 * 
 * NOTE: this should be applied to a SVG***SVG***Element (NOT a SVG***G***Element).
 * 
 * The zoom works by handling zoom events and translating them into new DataDomains, 
 * then it calls each of the user-provided callbacks to apply the zoom to the various elements.
 * 
 * To zoom programmatically you have the options to remember the callbacks names,
 * and only those with the names passed to the zoom function will be called,
 * allowing for multiple zoom controllers without callback loops
 * (like a zoom which modifies a brush, with the brush in turn zooming))
 * 
 * @param extent [ top-left, bottom-right ] the area the zoom behavior should cover
 * @param fullScales the scales of the two axis (using the *full* DataDomain)
 * @param dataDomainSelectionRefs the current selection in the data domains
 * @param onZoomEffects ```{ [key]: callback }``` the callbacks for when zoom is applied, 
 * keep track of the keys as they are used for programmatic zooming.
 * @param minMaxZoom the minimum and maximum zoom allowed
 * @param panOnWheeled the wheel action scrolls through the chart instead of zooming if enabled
 * 
 * @returns zoomTargetRef - a React Reference that must be applied to the element of
 * interest for the zooming to be initialized
 * @returns zoomTo - use this to programmatically zoom somewhere
 */
export function useZoom(
  extent: [[number, number], [number, number]],
  fullScales: {
    x: LinearNumericScale;
    y: LinearNumericScale;
  },
  dataDomainSelectionRefs: {
    x: React.MutableRefObject<Interval>,
    y: React.MutableRefObject<Interval>,
  },
  onZoomEffects: OnZoomCallbacks,
  minMaxZoom: Interval = [1, 5],
  panOnWheeled: boolean = true,
): [
    React.MutableRefObject<SVGSVGElement | null>,
    (newDataDomainSelections: Interval2D, newSelectedCallbacks?: string[], animate?: boolean, animationLength?: number) => void
  ] {

  /**
   * This reference will be used to apply the zoom by the hook user.
   */
  const zoomTargetRef = useRef<SVGSVGElement>(null);

  /**
   * Controls which callbacks will be used during the next zoom event.
   * 
   * When empty it will use all callbacks. It is reset after every zoom event.
   */
  const availableCallbacksRef = useRef<string[]>([])
  /**
   * This holds the given options for all callbacks during the zoom event.
   * It is reset after every zoom event.
   */
  const zoomOptionsRef = useRef<ZoomOptions>({})

  /**
   * Keeps track of zoom event handlers and other zoom options.
   */
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, SVGSVGElement>>();
  useLayoutEffect(() => {
    if (zoomTargetRef.current) {
      const zoomTargetElem = d3.select<SVGSVGElement, SVGSVGElement>(zoomTargetRef.current as SVGSVGElement);

      // Set the basic zoom function
      zoomBehaviorRef.current = d3.zoom<SVGSVGElement, SVGSVGElement>()
        .scaleExtent(minMaxZoom)        // This controls how much you can unzoom (x0.5) and zoom (x20)
        .extent(extent)                 // This controls over which area the zoom behavior extends
        .on("zoom", processZoomEvent)   // This controls what happens when zooming

      // Set the custom wheel behavior
      if (panOnWheeled) {
        zoomTargetElem
          .call(zoomBehaviorRef.current)
          .on("wheel.zoom", wheeled);

      } else {
        zoomTargetElem
          .call(zoomBehaviorRef.current);
      }
    }
  }, [panOnWheeled, minMaxZoom, extent])

  return [zoomTargetRef, restrictedZoomTo];

  /**
   * This function takes the normal zoom event and processes it,
   * calling the appropriate callbacks to modify the other elements.
   */
  function processZoomEvent() {
    // Retrive d3 event.
    const event = d3.event as d3.D3ZoomEvent<SVGSVGElement, [number, number]>

    // Find new DataDomain.
    const transform = event.transform
    const xNewScale = transform.rescaleX(fullScales.x);
    let xDataDomainSelection = xNewScale.domain() as Interval

    // Check if the DataDomain is unchanged
    if (intervalsAreEqual(xDataDomainSelection, dataDomainSelectionRefs.x.current)) {
      return;
    }

    // Check if the domain moves too much to the left, shift it back.
    const xDataDomainStart = fullScales.x.domain()[0];
    if (xDataDomainSelection[0] <= xDataDomainStart) {
      const difference = Math.abs(xDataDomainStart - xDataDomainSelection[0]);
      xDataDomainSelection = [xDataDomainStart, xDataDomainSelection[1] + difference]
    };
    // Check if the domain moves too much to the right, shift it back.
    const xDataDomainEnd = fullScales.x.domain()[1];
    if (xDataDomainSelection[1] >= xDataDomainEnd) {
      const difference = Math.abs(xDataDomainSelection[1] - xDataDomainEnd);
      xDataDomainSelection = [xDataDomainSelection[0] - difference, xDataDomainEnd]
    };

    // Update the dataDomainSelections Ref to ensure future (unrelated) renders use the updated value.
    dataDomainSelectionRefs.x.current = xDataDomainSelection;

    // Iterate over the callbacks, executing the ones in selectedCallbacks
    for (const effectKey in onZoomEffects) {
      if (availableCallbacksRef.current.length === 0 || availableCallbacksRef.current.includes(effectKey)) {

        onZoomEffects[effectKey](
          {
            x: dataDomainSelectionRefs.x.current,
            y: dataDomainSelectionRefs.y.current
          },
          zoomOptionsRef.current.animate,
          zoomOptionsRef.current.animationLength
        )

      }
    }

    // Reset temporary options after using them,
    // by default the zoom happens instantly and calls every callback.
    availableCallbacksRef.current = [];
    zoomOptionsRef.current = {
      animate: undefined,
      animationLength: undefined,
    };
  }

  /**
   * Overwrites the default d3 behavior for WheelEvent, 
   * this causes y scrolling events to be ignored, and x scrolling events to pan.
   */
  function wheeled() {
    // Recover d3 event
    const event = d3.event as WheelEvent;

    // Continue only if the scroll in the X direction is prevalent (ignore vertical scrolling).
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
      // Do NOT prevent default given that we are ignoring this wheel event.
      return;
    }

    /** The current scale (re-scaled to dataDomainSelection.x) */
    let xScale = d3.scaleLinear()
      .domain(dataDomainSelectionRefs.x.current)
      .range(fullScales.x.range());

    /** The movement (+/-) amount in PixelRange units */
    const xDeltaPixelRange = event.deltaX;

    /** The movement (+) amount in DataDomain units */
    const xDeltaDataDomain = xScale.invert(Math.abs(xDeltaPixelRange)) - xScale.invert(0);
    // let xDeltaDomainCorrected = Math.round((xDeltaDomain));
    // let xDeltaDomainCorrected = Math.round(xDeltaDomain ** 0.5);
    // let xDeltaDomainCorrected = Math.round(xDeltaDomain ** 0.6);
    /** The corrected movement (+) amount in DataDomain units */
    let xDeltaDataDomainCorrected = xDeltaDataDomain ** 0.6;

    const xFullDataDomain = fullScales.x.domain() as Interval;
    const xCurrentDataDomainSelection = dataDomainSelectionRefs.x.current;
    let xNewDataDomainSelection: Interval;
    // Check if the movements would push the domain outside its bounds.
    // If it does, reduce the movement so that it moves to the edge.
    if (xDeltaPixelRange >= 0) {
      if (xCurrentDataDomainSelection[1] + xDeltaDataDomainCorrected > xFullDataDomain[1]) {
        xDeltaDataDomainCorrected = xFullDataDomain[1] - xCurrentDataDomainSelection[1];
      }
      xNewDataDomainSelection = [
        xCurrentDataDomainSelection[0] + xDeltaDataDomainCorrected,
        xCurrentDataDomainSelection[1] + xDeltaDataDomainCorrected
      ]
    } else {
      if (xCurrentDataDomainSelection[0] - xDeltaDataDomainCorrected < xFullDataDomain[0]) {
        xDeltaDataDomainCorrected = xCurrentDataDomainSelection[0] - xFullDataDomain[0];
      }
      xNewDataDomainSelection = [
        xCurrentDataDomainSelection[0] - xDeltaDataDomainCorrected,
        xCurrentDataDomainSelection[1] - xDeltaDataDomainCorrected
      ]
    }

    // If the result is the full domain, stop without preventing the default behavior.
    if (intervalsAreEqual(xNewDataDomainSelection, xFullDataDomain)) {
      return;
    }

    // If the domain doesn't change, stop here and prevent the default behavior.
    // This is necessary to avoid going back a page when the user finishes scrolling
    // to the edge of the chart.
    if (intervalsAreEqual(xNewDataDomainSelection, xCurrentDataDomainSelection)) {
      return event.preventDefault && event.preventDefault();
    }

    // // Compute some factors that might be useful for animations
    // const movementFraction = xDeltaDataDomainCorrected / Math.sqrt(xFullDataDomain[1])
    // const scaling = (xFullDataDomain[1] - xFullDataDomain[0]) / (xNewDataDomainSelection[1] - xNewDataDomainSelection[0])

    zoomTo({ x: xNewDataDomainSelection, y: fullScales.y.domain() } as Interval2D)

    return event.preventDefault && event.preventDefault();
  }

  /**
   * Programmatically zoom somewhere. 
   * 
   * (That is, this function is not necessarilty triggered by a zoom event).
   * Converts a target DataDomain to a d3 ZoomTransfrom and triggers a zoom action.
   * 
   * @param newDataDomainSelections 
   * @param duration 
   */
  function zoomTo(newDataDomainSelections: Interval2D, duration = 0): void {
    /** The Data Domain we are zooming to */
    const xTargetDataDomain = newDataDomainSelections.x;

    // If the Data Domain doesn't change, stop.
    if (intervalsAreEqual(xTargetDataDomain, dataDomainSelectionRefs.x.current)) {
      return;
    }

    const xFullDataDomain = fullScales.x.domain();

    /** The amount of multiplicative zoom (how zoomed in or out) */
    const scaling = (xFullDataDomain[1] - xFullDataDomain[0]) / (xTargetDataDomain[1] - xTargetDataDomain[0]);

    /** The amount of translational zoom (how much the view is shifted) */
    const shift = fullScales.x(xTargetDataDomain[0]);

    /** A d3.Transform object which holds the parameters needed to move to the target DataDomain */
    const transform = d3.zoomIdentity
      .scale(scaling)
      .translate(-shift, 0);

    // Apply the transform on the object (this will call the zoom event handler above).
    if (zoomTargetRef.current && zoomBehaviorRef.current) {

      const svg = d3.select<SVGSVGElement, SVGSVGElement>(zoomTargetRef.current as SVGSVGElement);

      zoomBehaviorRef.current.transform(svg.transition().duration(duration), transform);
    }
  }

  /**
   * Programmatically zoom somewhere. 
   * 
   * You may use only some callbacks by including an array of the corresponding keys.
   * 
   * @param newDataDomainSelections 
   * @param selectedCallbacks - An array of keys corresponding to the callbacks setup
   * when calling the hook.
   * @param animate 
   * @param animationLength 
   */
  function restrictedZoomTo(
    newDataDomainSelections: Interval2D,
    selectedCallbacks?: string[],
    animate?: boolean,
    animationLength: number = 0,
  ) {

    // Set the callbacks so that only some are called when the zoom event is triggered.
    if (selectedCallbacks) {
      availableCallbacksRef.current = selectedCallbacks;
    }

    // Set the options used when zooming
    if (animate) {
      zoomOptionsRef.current = {
        animate: animate,
        animationLength: animationLength,
      }
    }

    zoomTo(newDataDomainSelections);
  }

}