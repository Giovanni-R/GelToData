import React, { useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { OVERLAY_Z_INDEX } from '../../definitions';

/**
 * A loading animation showing a 3-lane electrophoresis gel running.
 * 
 * Each time the animation is mounted it generates new random bands.
 * 
 * @param props 
 */
export function LoadingAnimation(props: {
  time?: number,
  zIndex?: number,
  opacity?: number,
  backgroundColor?: string,
}) {

  // The starting coordinates of the bands (in the three wells)
  const yStart = 10;
  const xStart = [[10, 30], [40, 60], [70, 90]]
  const start = xStart.map((x) => `M ${x[0]} ${yStart} L ${x[1]} ${yStart}`)

  // The ending coordinates of the bands (at the end of the gel)
  const yEnd = 85;
  const xEnd = xStart;
  const end = xEnd.map((x) => `M ${x[0]} ${yEnd} L ${x[1]} ${yEnd}`)

  // The number of bands in each lane. The first is the ladder.
  const numberOfBands = [10, 2, 3];

  const t = props.time ?? 10;
  const background = props.backgroundColor ?? "rgb(200,200,200)";
  const opacity = props.opacity ?? 0.9;

  const styling = {
    zIndex: props.zIndex ?? OVERLAY_Z_INDEX,
  }

  const classes = loadignScreenStyle(styling);

  return (
    <div className={classes.root}>
      <div className={classes.loadingAnimation}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" rx="5" ry="5" fill={background} opacity={opacity} />
          {/* Lanes */}
          {numberOfBands.map((n, i) =>
            <Lane
              key={i}
              laneID={i}
              start={start[i]}
              end={end[i]}
              animationTime={t}
              numberOfBands={n} />)}
          Sorry, your browser does not support inline SVG.
        </svg>
      </div>
    </div>
  )
}

/**
 * A Lane component which groups a well and the corresponding bands.
 * @param props 
 */
function Lane(props: {
  laneID: number,
  start: string,
  end: string,
  animationTime: number,
  numberOfBands: number,
}) {

  const wellColor = "rgb(130,130,130)";
  const wellThickness = 5;

  return (
    <g>

      <Band
        id={-1}
        start={props.start}
        end={props.start}
        animationTime={0}
        color={wellColor}
        thickness={wellThickness} />

      {(new Array(props.numberOfBands)).fill(<g></g>).map((_, i) =>
        <Band
          key={`${props.laneID} ${i}`}
          id={i}
          numberOfSiblings={props.numberOfBands}
          start={props.start}
          end={props.end}
          animationTime={props.animationTime}
          isLadder={(props.laneID === 0)}
        />
      )}

    </g>
  )
}

/**
 * A Band component which generates a band randomly.
 * 
 * If the bad is part of the Ladder its speed is deterministic based on its index.
 * @param props 
 */
function Band(props: {
  id: number,
  start: string;
  end: string;
  animationTime: number,
  isLadder?: boolean,
  numberOfSiblings?: number,
  color?: string,
  thickness?: number,
}) {
  const start = props.start;
  const end = props.end;
  const time = props.animationTime;

  const useDeterministicKeyTimes = !!(props.isLadder && props.id && props.numberOfSiblings);
  const bandIndex = useDeterministicKeyTimes ? props.id : undefined;
  const bandSiblings = useDeterministicKeyTimes ? props.numberOfSiblings : undefined;
  return (
    <path
      d={start}
      stroke={props.color ?? useBandColor()}
      strokeWidth={props.thickness ?? useBandThickness()}
      strokeLinecap="round"
      opacity={0.8}>
      <animate
        from={start}
        to={end}
        begin={"0s"}
        attributeName="d"
        values={`
                ${start};
                ${end};
                ${end}
                `}
        dur={time}
        keyTimes={useKeyTimes(bandIndex, bandSiblings)}
        fill="freeze"
        repeatCount="indefinite" />
    </path>
  )
}

/**
 * An helper function used to determine the color of a lane.
 */
function useBandColor() {
  const seedRef = useRef(Math.random());
  const seed = seedRef.current;
  const value = 20 + 80 * seed;
  return `rgb(${value},${value},${value})`
}
/**
 * An helper function used to determine the thickness of a lane.
 */
function useBandThickness() {
  const seedRef = useRef(Math.random());
  const seed = seedRef.current;
  return 0.5 + seed * 3;
}
/**
 * An helper function used to determine the speed of a lane.
 * It's deterministic in the ladder bands which it detects by the fact that
 * the band index and number of siblings are passed as arguments.
 */
function useKeyTimes(id?: number, numberOfSiblings?: number) {
  const seedRef = useRef(Math.random());
  const seed = seedRef.current;
  if (id && numberOfSiblings) {
    const keyTime = (id + 1) / numberOfSiblings;
    return `0; ${keyTime}; 1`;
  } else {
    return `0; ${0.5 + seed * 0.5}; 1`;
  }
}

const loadignScreenStyle = makeStyles((theme) => ({
  root: {
    position: "absolute",
    margin: 0,
    width: "100%",
    height: "100%",
    zIndex: (props: { zIndex: number }) => props.zIndex,
  },
  loadingAnimation: {
    position: "absolute",
    margin: 0,
    maxWidth: "20%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: (props: { zIndex: number }) => props.zIndex + 100,
  }
}));