import React, { useState, useContext, useRef } from 'react';
import { useMountEffect } from '../../../definitions';

import { Paper, TextField, Button, Grid, Typography } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';

import { WorkerContext } from '../MainView';
import { WorkerOutputSubscription } from '../../../definitions';
import { ChartSize, ChartMargin } from '../../Charts/charts.definitions';
import { downloadBlob } from '../../../utilities';
import { InfoTooltip } from '../../Assorted/InfoTooltip';
import { AreaChart } from '../../Charts/StackedAreaChart/AreaChart'

/**
 * This component displays the lanes as a list of charts and allows the
 * user to download the corresponding data.
 */
export function ChartView() {

  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [lanes, setLanes] = useState<number[][][]>([]);

  /**
   * Holds the names of the lanes, it's a ref because no re-render is
   * needed to keep track of them and the user input is uncrontrolled.
   */
  const laneNamesRef = useRef<string[]>([]);

  const [subcribeToWorkerFor,] = useContext(WorkerContext);
  useMountEffect(() => {
    subcribeToWorkerFor({
      target: "processed lanes",
      callback: onProcessedLanesFromWW,
    } as WorkerOutputSubscription)
  });

  // This defines the chart's aspect ratio (brush not included).
  const chartSize: ChartSize = {
    width: 1000,
    height: 300,
  };
  const chartMargin: ChartMargin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 45,
  };

  const classes = chartViewStyles();
  return (
    <Grid container spacing={0} className={classes.root}>

      {/* Button to toggle the visibility of the charts */}
      <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="center">
        <Button size="small" variant="contained" onClick={() => setShowCharts(!showCharts)}>
          {(!showCharts) ? "Show Charts" : "Hide Charts"}
        </Button>

      </Grid>

      {/* Section Title */}
      {(showCharts) ?
        <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="center">
          <Grid item className={classes.griditem}>
            <Typography variant="h6" align="center">
              Lane Charts:
            </Typography>
          </Grid>
          <Grid item className={classes.griditem}>
            <InfoTooltip
              title={
                <div>
                  The charts, written using d3-based hooks, show the density profiles of the lanes.<br />
                On a computer, you may use the brush or double-click to zoom and horizontal two-finger scroll to move thorugh the chart.
                Touch interactions work as expected. <br />
                </div>}
            />
          </Grid>
        </Grid>
        : <></>
      }

      {/* The charts */}
      {(showCharts) ? lanes.map((lane, index) => generateChart(lane, index)) : <></>}

      {/* Download button for the csv dataset */}
      {(lanes.length > 0) ?
        <Grid container item className={classes.griditem} direction="row" justify="center" alignItems="center">
          <Button size="small" variant="contained" onClick={() => downloadDataset()}>
            <span>Download lane data</span>
            <InfoTooltip
              title={
                <div>
                  The lane data will be downloaded as a .cvs file, with each row representing a lane. <br />
                  The assigned names will be preserved.
                </div>
              }
              inline={false}
            />
          </Button>
        </Grid>
        : <></>
      }
    </Grid>
  )

  /**
   * The subscription callback which updates the displayed lanes.
   * @param newLanes 
   */
  function onProcessedLanesFromWW(newLanes: number[][][]) {
    let newLaneNames = new Array<string>(newLanes.length);
    for (let i = 0; i < newLaneNames.length; i++) {
      // Overwrite any empty strings
      newLaneNames[i] = laneNamesRef.current[i] || `Lane ${i + 1}`
    }
    laneNamesRef.current = newLaneNames
    setLanes(newLanes);
  }

  /**
   * A helper function which maps a lane and its index to the corresponding JSX.Element
   * 
   * @param lane 
   * @param index 
   */
  function generateChart(lane: number[][], index: number) {
    return (
      <Grid key={`Lane ${index + 1}`} container item className={classes.griditem} direction="row" justify="center" alignItems="center">
        <Paper className={classes.chart}>

          <TextField
            className={classes.textfield}
            id={`filled-basic-lane-${index + 1}`}
            label={`Lane ${index + 1}`}
            variant="filled"
            size="small"
            onChange={(event) => updateLaneName(index, event.target.value)} />

          <AreaChart lane={lane} size={chartSize} margin={chartMargin} />

        </Paper>
      </Grid>
    )
  }

  /**
   * Keeps track of the lanes without re-rendering.
   * @param index 
   * @param newName 
   */
  function updateLaneName(index: number, newName: string) {
    laneNamesRef.current[index] = newName.replace(",", ";") || `Lane ${index + 1}`;
  }

  /**
   * Downloads the currently displayed lanes as a csv dataset
   * @param filename 
   */
  function downloadDataset(filename: string = "dataset.csv") {
    downloadBlob(generateCSV(), filename);
  }

  /**
   * Converts an array of arrays to a csv document in the form of a Blob.
   */
  function generateCSV() {
    const names = laneNamesRef.current;

    const laneToString = (lane: number[][], laneIndex: number) => {
      return `${names[laneIndex]}, ${lane.map(valuesToSum).join(",")}`
    }
    const valuesToSum = (values: number[]) => {
      return values.reduce((a, b) => a + b, 0);
    }

    return new Blob(
      [lanes.map(laneToString).join(",\n")],
      { type: 'text/csv' })
  }
}

interface StylingOptions {
  sideMargins: number,
}

const chartViewStyles = makeStyles((theme: Theme, props?: StylingOptions) => ({
  root: {
    maxWidth: "100%",
    margin: "auto",
    marginTop: theme.spacing(2),
  },
  griditem: {
    margin: theme.spacing(1),
  },
  chart: {
    margin: "auto",
    width: "100%",
  },
  textfield: {
    marginBottom: theme.spacing(1),
    width: "100%",
  },
  info: {
    position: "absolute",
    color: theme.palette.text.primary,
    right: "-30px",
  },
}));