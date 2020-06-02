import React, { useState, useContext, useLayoutEffect } from 'react';

import { makeStyles, Slider, IconButton } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';

import { Lane } from './Lane';
import { getDefaultLaneBorders } from '../../../../utilities';
import { WorkerContext } from '../../MainView';
import { WorkerInput } from '../../../../definitions';

/**
 * This component produces the overlay over the gel image
 * which displays the lanes. It includes the slider used to control
 * lane positioning and the visibility button to show/hide the lanes.
 */
export function LaneOverlay(props: {
  laneNumber: number,
  width: number,
}) {

  const width = props.width;

  // The component will need to update the worker when new lanes are selected.
  const [, updateWorker] = useContext(WorkerContext);

  const [showLanes, setShowLanes] = useState(true);

  // The lanes are stored as fractional positions [a, b] of the width
  const [laneBorders, setLaneBorders] = useState<number[][]>(() => {
    const defaultLaneBorders = getDefaultLaneBorders(width, props.laneNumber);
    commitLaneChanges(defaultLaneBorders);
    return defaultLaneBorders;
  });

  // If the width changes (upon rotation, for example), or the number of lanes is changes
  // the lanes should be recomputed.
  useLayoutEffect(() => {
    const newLaneBorders = getDefaultLaneBorders(width, props.laneNumber);
    commitLaneChanges(newLaneBorders);
    setLaneBorders(newLaneBorders)
  }, [width, props.laneNumber])

  /**
   * This is a low level overwrite (applied to "classes" in Slider) of the thumb press area of the marks to 
   * avoid invisible overflow at the edge of the page which messes with the layout by pushing the
   * edge of the page. It doesn't affect the UX much because the slider automatically selects
   * the closest mark anyway.
   */
  const deepClasses = sliderStyles();

  const classes = laneOverlayStyles();
  return (
    <>

      {laneBorders.map((position, index) => generateLane(position, index))}

      <Slider
        classes={{ thumb: deepClasses.thumb }}
        color="primary"
        min={0}
        step={1}
        max={width - 1}
        valueLabelDisplay="auto"
        aria-labelledby="track-inverted-range-slider"
        getAriaValueText={(value: number) => (value + "")}
        // For some reason .flat is not in the index files.
        // @ts-ignore
        value={laneBorders.flat<number[][]>()}
        className={classes.slider}
        onChange={(e, value) => handleLanesChange(value)}
        onChangeCommitted={() => commitLaneChanges(laneBorders)}
      />

      <IconButton
        aria-label="toggle-lane-visibility"
        size="small"
        className={classes.button}
        onClick={() => handleVisibilityButtonClick()}
      >
        <VisibilityIcon />
      </IconButton>

    </>
  );

  /**
   * Handles the slider events and properly converts its output to lanes.
   * @param values 
   */
  function handleLanesChange(values: (number[] | number)) {
    if (Array.isArray(values)) {
      const numberOfValues = values.length;

      if (numberOfValues % 2 !== 0) {
        throw new Error("The lane slider has an odd number of markers.");
      }

      const flatLanes: number[] = values.sort((a, b) => a - b);
      let pairedLanes: number[][] = new Array<number[]>(numberOfValues / 2);
      for (let i = 0; i < pairedLanes.length; i++) {
        pairedLanes[i] = [flatLanes[2 * i], flatLanes[2 * i + 1]]
      }
      setLaneBorders(pairedLanes);

    } else {
      throw new Error("The lane slider values are only one or zero.");
    }
  }

  /**
   * Sends the passed lanes to the worker.
   * @param laneBorders 
   */
  function commitLaneChanges(laneBorders: number[][]) {
    updateWorker({
      target: "selected lanes",
      value: laneBorders,
    } as WorkerInput);
  }

  /**
   * A simple handler for the visibility button which
   * toggles the visibility of the lanes.
   */
  function handleVisibilityButtonClick() {
    setShowLanes(!showLanes);
  }

  /**
   * A helper function which converts a lane and an index to
   * a Lane component.
   * @param lane 
   * @param index 
   */
  function generateLane(lane: number[], index: number): any {
    const position: number[] = [lane[0] / width, lane[1] / width];
    return (
      <Lane
        key={`Lane ${index + 1}`}
        position={position}
        color="red"
        opacity={0.2}
        show={showLanes} />
    )
  }
}

const sliderStyles = makeStyles(theme => ({
  thumb: {
    '&::after': {
      left: -5,
      right: -5,
    }
  }
}));

const laneOverlayStyles = makeStyles(theme => ({
  slider: {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    transform: "translateY(+65%)",
  },
  button: {
    position: "absolute",
    top: 0,
    right: 0,
    background: "rgb(50, 50, 50, 0.1)",
    color: "white",
  },
}));