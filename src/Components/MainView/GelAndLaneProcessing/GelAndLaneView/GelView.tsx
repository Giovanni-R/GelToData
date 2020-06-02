import React, { useState, ReactNode } from 'react';

import { makeStyles, Paper, CardMedia, Tooltip, ButtonGroup, Button, Grid, Typography } from '@material-ui/core';

import { LaneOverlay } from './LaneOverlay';
import { ImageSize } from '../../../../definitions';
import { InfoTooltip } from '../../../Assorted/InfoTooltip';

const elevation = 5;
const initialLaneCount = 5;

/**
 * This component displays the current computed image and lanes.
 * It allows the user to change the number and location of the lanes.
 */
export function GelView(props: {
  imageDataURL: string,
  size: ImageSize,
  children: ReactNode,
}) {

  const width = props.size.width;

  const [numberOfLanes, setNumberOfLanes] = useState(initialLaneCount)

  const classes = gelViewStyles();
  return (
    <Grid container spacing={0} className={classes.root}>

      {/* Section Title */}
      <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="baseline">
        <Grid item className={classes.griditem}>
          <Typography variant="h6" align="center">
            Lane selection:
        </Typography>
        </Grid>
        <Grid item className={classes.griditem}>
          <InfoTooltip
            title={
              <div>
                In this section you may edit the number of lanes and their locations. <br />
                Any change will be quickly reflected in the charts below.
              </div>}
          />
        </Grid>
      </Grid>

      {/* Lane number button */}
      <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="center">
        <Tooltip title={"The number of lanes"} placement={"bottom"} arrow>
          <ButtonGroup size="small" aria-label="small outlined button group">
            <Button size="small" variant="contained" onClick={() => handleLaneCountChange(-1)}>-</Button>
            <Button size="small" variant="outlined" style={{ pointerEvents: "none" }}>{numberOfLanes}</Button>
            <Button size="small" variant="contained" onClick={() => handleLaneCountChange(1)}>+</Button>
          </ButtonGroup>
        </Tooltip>
      </Grid>

      <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="center">
        <Paper className={classes.paper} elevation={elevation}>

          {/* The overlay (lanes + slider + visibility button)*/}
          <LaneOverlay laneNumber={numberOfLanes} width={width} />

          {/* Loading animation from parent */}
          {props.children}

          {/* The actual gel image */}
          <CardMedia className={classes.image} component="img" image={props.imageDataURL} />

        </Paper>
      </Grid>

    </Grid>
  );

  /**
   * A simple event handler for the lane number buttons.
   * @param change 
   */
  function handleLaneCountChange(change: number) {
    if (numberOfLanes + change <= 0) return;
    setNumberOfLanes(numberOfLanes + change);
  }
}


const gelViewStyles = makeStyles(theme => ({
  root: {
    maxWidth: "100%",
    margin: "auto",
    marginTop: theme.spacing(2),
  },
  griditem: {
    margin: theme.spacing(1),
  },
  paper: {
    position: "relative",
  },
  image: {
    maxWidth: "100%",
    borderRadius: 2,
  },
}));