import React, { useState, useContext } from "react";
import { useMountEffect } from "../../../../definitions"

import { makeStyles, Paper, Grid, CardMedia, Tooltip } from "@material-ui/core";

import { getSizedSVG } from "../../../../utilities";
import { WorkerContext } from "../../MainView";
import { WorkerOutputSubscription, ImageSize } from "../../../../definitions";

const elevation = 5;

const redColor = "#b71c1c";
const innerRedColor = "#ef9a9a";
const greenColor = "#1b5e20";
const innerGreenColor = "#c8e6c9"
const blueColor = "#283593";
const innerBlueColor = "#bbdefb"
const borderThickness = 3;
const selectedOpacity = 1;
const unselectedOpacity = 0.5;

/**
 * This componet allows the user to selects among the three RGB channnels.
 * It restricts the choice so that at least one is always selected.
 * @param props 
 */
export function ChannelSelector(props: {
  size: ImageSize,
  onChannelSelection: (channels: boolean[]) => void,
  defaultSelectedChannels?: boolean[],
}) {

  const [selectedChannels, setSelectedChannels] = useState<boolean[]>(
    props.defaultSelectedChannels ?? [true, true, true]
  );
  // A placeholder image is generated while waiting for the actual channel images.
  const [channelURLs, setChannelURLs] = useState<string[]>(() => {
    const sizedSVG = getSizedSVG(props.size)
    return [sizedSVG, sizedSVG, sizedSVG]
  })

  const [subscribeToWorkerFor,] = useContext(WorkerContext);
  useMountEffect(() => {
    subscribeToWorkerFor({
      target: "processed channels",
      callback: onProcessedChannelsFromWW as WorkerOutputSubscription["callback"],
    })
  })

  // The channel images show their selection by their elevation and border,
  // which is bold when selected, and transparent when not.
  const selectedStyle = {
    redBorderColor: (selectedChannels[0]) ? redColor : "transparent",
    greenBorderColor: (selectedChannels[1]) ? greenColor : "transparent",
    blueBorderColor: (selectedChannels[2]) ? blueColor : "transparent",
    redOpacity: (selectedChannels[0]) ? selectedOpacity : unselectedOpacity,
    greenOpacity: (selectedChannels[1]) ? selectedOpacity : unselectedOpacity,
    blueOpacity: (selectedChannels[2]) ? selectedOpacity : unselectedOpacity,
  }

  const classes = channelSelectorStyles(selectedStyle);
  return (
    <>
      <Grid className={classes.griditem} xs={6} item>
        <Tooltip title={"Toggle RED channel"} placement={"bottom"} arrow>

          <Paper
            className={classes.red}
            elevation={(selectedChannels[0]) ? elevation : 0}
            onClick={() => handleClick(0)}>
            <CardMedia className={classes.image} component="img" image={channelURLs[0]} />
          </Paper>

        </Tooltip>
      </Grid>

      <Grid className={classes.griditem} xs={6} item>
        <Tooltip title={"Toggle GREEN channel"} placement={"bottom"} arrow>

          <Paper
            className={classes.green}
            elevation={(selectedChannels[1]) ? elevation : 0}
            onClick={() => handleClick(1)}>
            <CardMedia className={classes.image} component="img" image={channelURLs[1]} />
          </Paper>

        </Tooltip>
      </Grid>

      <Grid className={classes.griditem} xs={6} item>
        <Tooltip title={"Toggle BLUE channel"} placement={"bottom"} arrow>

          <Paper
            className={classes.blue}
            elevation={(selectedChannels[2]) ? elevation : 0}
            onClick={() => handleClick(2)}>
            <CardMedia className={classes.image} component="img" image={channelURLs[2]} />
          </Paper>

        </Tooltip>
      </Grid>
    </>
  )

  /**
   * Flips the state of the indicated channel as long as at least one
   * channel remains active.
   * @param clickedChannel 
   */
  function handleClick(clickedChannel: number) {
    let newChannels = [...selectedChannels];
    newChannels[clickedChannel] = !newChannels[clickedChannel];
    if (newChannels[0] || newChannels[1] || newChannels[2]) {
      setSelectedChannels(newChannels);
      props.onChannelSelection(newChannels);
    }
  }

  /**
   * The callback for the subscription to the web worker for new channel images.
   * @param newChannelURLs 
   */
  function onProcessedChannelsFromWW(newChannelURLs: string[]) {
    setChannelURLs(newChannelURLs);
  }
}

interface StylingOptions {
  redBorderColor: string,
  greenBorderColor: string,
  blueBorderColor: string,
  redOpacity: number,
  greenOpacity: number,
  blueOpacity: number,
}
const channelSelectorStyles = makeStyles(theme => ({
  griditem: {
    flexGrow: 1,
    margin: theme.spacing(1),
  },
  red: {
    borderStyle: "solid",
    borderWidth: borderThickness,
    borderColor: (props: StylingOptions) => props.redBorderColor,
    backgroundColor: innerRedColor,
    opacity: (props: StylingOptions) => props.redOpacity,
  },
  green: {
    borderStyle: "solid",
    borderWidth: borderThickness,
    borderColor: (props: StylingOptions) => props.greenBorderColor,
    backgroundColor: innerGreenColor,
    opacity: (props: StylingOptions) => props.greenOpacity,
  },
  blue: {
    borderStyle: "solid",
    borderWidth: borderThickness,
    borderColor: (props: StylingOptions) => props.blueBorderColor,
    backgroundColor: innerBlueColor,
    opacity: (props: StylingOptions) => props.blueOpacity,
  },
  image: {
    maxWidth: "100%",
    borderRadius: borderThickness,
  },
}));