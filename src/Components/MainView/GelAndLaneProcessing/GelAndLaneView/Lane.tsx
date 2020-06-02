import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

/**
 * A simple rectangle representing a lane on a gel.
 * 
 * @param position - the position of the mark in [0, 1] fractions
 * @param color
 * @param opacity
 * @param show - a toggle to hide the lane.
 */
export function Lane(props: {
  position: number[], // fractional positions
  color: string,
  opacity: number,
  show: boolean,
}) {

  const startingPosition: string = `${100 * props.position[0]}%`;
  const width: string = `${100 * (props.position[1] - props.position[0])}%`

  const style: styleProperties = {
    show: (props.show) ? "block" : "none",
    position: startingPosition,
    width: width,
    color: props.color,
    opacity: props.opacity,
  }

  const classes = laneStyles(style);
  return (
    <div className={classes.lane}></div>
  )

}

interface styleProperties {
  show: string,
  position: string,
  width: string,
  color: string,
  opacity: number,
}

const laneStyles = makeStyles((theme) => ({
  lane: {
    display: (props: styleProperties) => props.show,
    position: "absolute",
    top: 0,
    left: 0,
    marginLeft: (props: styleProperties) => props.position,
    width: (props: styleProperties) => props.width,
    height: "100%",
    backgroundColor: (props: styleProperties) => props.color,
    opacity: (props: styleProperties) => props.opacity,
  },
}));