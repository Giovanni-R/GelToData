import React, { useState, useContext } from 'react';
import { useMountEffect, ImageSize } from "../../../../definitions"

import {
  Typography, Button, Grid, Tooltip, InputAdornment, makeStyles, ButtonGroup, FormControl, InputLabel, OutlinedInput
} from '@material-ui/core';
import { RotateRight } from '@material-ui/icons';

import {
  imagePreProcessingOptions, DEFAULT_PREPROCESSING_SETTINGS as defaultSettings,
  rotationOptions, WorkerInput, filterOptions,
} from '../../../../definitions';
import { ChannelSelector } from './ChannelSelector';
import { WorkerContext } from '../../MainView'
import { InfoTooltip } from '../../../Assorted/InfoTooltip';

export function PreProcessing(props: {
  components: number,
  size: ImageSize,
  onSettingsChange: (newSettings: imagePreProcessingOptions) => void,
}) {

  // Setup the state
  const [selectedChannels, setSelectedChannels] = useState(
    () => new Array<boolean>(props.components).fill(true)
  );
  const [rotation, setRotation] = useState<rotationOptions>(
    defaultSettings.rotation
  );
  const [inversion, setInversion] = useState(
    defaultSettings.inversion
  );
  const [normalization, setNormalization] = useState(
    defaultSettings.normalization
  );
  const [threshold, setThreshold] = useState(
    defaultSettings.threshold
  );
  const [noiseRemoval,] = useState<filterOptions[]>(
    defaultSettings.noiseRemoval
  );

  // Setup the worker connection
  const [, updateWorker] = useContext(WorkerContext);
  // On the first render, update the worker with the initial settings.
  useMountEffect(() => {
    updateWorker({
      target: "preprocessing settings",
      value: {
        selectedChannels: selectedChannels,
        rotation: rotation,
        inversion: inversion,
        normalization: normalization,
        threshold: threshold,
        noiseRemoval: noiseRemoval,
      },
    })
  })


  const classes = preProcessingStyles();

  return (
    <Grid container spacing={0} className={classes.root}>

      {/* Section Title */}
      <Grid container item direction="row" justify="center" alignItems="baseline">

        <Grid item className={classes.griditem}>
          <Typography variant="h6" align="center">
            Image preprocessing options:
          </Typography>
        </Grid>

        <Grid item className={classes.griditem}>
          <InfoTooltip
            title={
              <div>
                In this section you may choose to: <br />
                {(props.components === 3) ? <span>•Select which color channels to keep<br /></span> : <></>}
                •Rotate and invert the image<br />
                •Apply a minimum threshold to remove some of the background noise<br />
                •Normalize the image so that the entire range of possible values is used<br />
              </div>}
          />
        </Grid>
      </Grid>

      {/* Channel Selector */}
      <Grid container item direction="row" justify="center" alignItems="center" wrap="nowrap">
        {
          (props.components === 3) ?
            <ChannelSelector
              size={props.size}
              onChannelSelection={(channels: boolean[]) => handleChannelSelection(channels)} />
            : <></>
        }
      </Grid>

      {/* Preprocessing Options */}
      <Grid container item direction="row" justify="center" alignItems="center" wrap="wrap">

        {/* Rotation */}
        <Grid item className={classes.griditem}>
          <Tooltip title={<div style={{ textAlign: "center" }}>Rotate to make sure that: <br /> ↓ Molecules ↓</div>} placement={"bottom"} interactive arrow>
            <Button
              size="small"
              variant="text"
              onClick={() => handleRotationChange()}>
              <RotateRight />
            </Button>
          </Tooltip>
        </Grid>

        {/* Inversion */}
        <Grid item className={classes.griditem}>
          <Tooltip title={"Invert the colors of the image"} placement={"bottom"} interactive arrow>
            <Button
              size="small"
              variant={(inversion) ? "contained" : "outlined"}
              onClick={() => handleInversionChange()}>
              Invert
            </Button>
          </Tooltip>
        </Grid>

        {/* Normalization */}
        <Grid item className={classes.griditem}>
          <Tooltip title={"Normalize the image to its max/min values"} placement={"bottom"} interactive arrow>
            <Button
              size="small"
              variant={(normalization) ? "contained" : "outlined"}
              onClick={() => handleNormalizationChange()}>
              Normalize
          </Button>
          </Tooltip>
        </Grid>

        {/* Filters */}
        {/* <Grid item className={classes.griditem}>
          <Tooltip title={"Filters are applied in their selected order"} placement={"bottom"} arrow>
            <ButtonGroup
              size="small"
              aria-label="small outlined button group">
              <Button
                size="small"
                variant={(noiseRemoval.includes(1)) ? "contained" : "outlined"}
                onClick={() => handleFilterChange(1)}
              >
                Median Filter</Button>
            </ButtonGroup>
          </Tooltip>
        </Grid> */}

        {/* Thresholding */}
        <Grid item className={classes.griditem}>

          <Tooltip title={"All values lower than the threshold will be set to 0"} placement={"bottom"} interactive arrow>
            <FormControl size="small" variant="outlined" className={classes.inputfield}>

              <InputLabel htmlFor="outlined-adornment-threshold">Threshold</InputLabel>
              <OutlinedInput
                placeholder="0"
                id="outlined-adornment-amount"
                value={Math.round(100 * threshold)}
                onChange={handleThresholdChange}
                startAdornment={<InputAdornment position="start">%</InputAdornment>}
                labelWidth={80}
              />

            </FormControl>
          </Tooltip>

        </Grid>

      </Grid>

    </Grid>
  );

  function handleChannelSelection(newChannels: boolean[]): void {
    setSelectedChannels(newChannels);
    const newSettings: imagePreProcessingOptions = {
      selectedChannels: newChannels, // NEW
      rotation: rotation,
      inversion: inversion,
      normalization: normalization,
      threshold: threshold,
      noiseRemoval: noiseRemoval,
    }
    handleSettingsChange(newSettings);
  }

  function handleRotationChange(): void {
    let newRotationValue: rotationOptions;
    if (rotation === 3) {
      newRotationValue = 0;
    } else {
      newRotationValue = ((rotation + 1) as rotationOptions);
    }
    setRotation(newRotationValue);
    const newSettings: imagePreProcessingOptions = {
      selectedChannels: selectedChannels,
      rotation: newRotationValue, // NEW
      inversion: inversion,
      normalization: normalization,
      threshold: threshold,
      noiseRemoval: noiseRemoval,
    }
    handleSettingsChange(newSettings);
  }

  function handleInversionChange(): void {
    setInversion(!inversion);
    const newSettings: imagePreProcessingOptions = {
      selectedChannels: selectedChannels,
      rotation: rotation,
      inversion: !inversion, // NEW
      normalization: normalization,
      threshold: threshold,
      noiseRemoval: noiseRemoval,
    }
    handleSettingsChange(newSettings);
  }

  function handleNormalizationChange(): void {
    setNormalization(!normalization);
    const newSettings: imagePreProcessingOptions = {
      selectedChannels: selectedChannels,
      rotation: rotation,
      inversion: inversion,
      normalization: !normalization, // NEW
      threshold: threshold,
      noiseRemoval: noiseRemoval,
    }
    handleSettingsChange(newSettings);
  }

  function handleThresholdChange(event: any): void {
    let newThreshold = event.target.value;
    if (!isNaN(newThreshold) && newThreshold >= 0 && newThreshold <= 100) {
      newThreshold /= 100;
    } else {
      if (newThreshold < 0) {
        newThreshold = 0;
      }
      else {
        newThreshold = 100 / 100
      }
    }
    setThreshold(newThreshold);
    const newSettings: imagePreProcessingOptions = {
      selectedChannels: selectedChannels,
      rotation: rotation,
      inversion: inversion,
      normalization: normalization,
      threshold: newThreshold, // new
      noiseRemoval: noiseRemoval,
    }
    handleSettingsChange(newSettings);
  }

  // function handleFilterChange(newFilter: filterOptions): void {
  //   let newNoiseSettings: filterOptions[] = [];
  //   let clickedFilterIsActive: boolean = false;

  //   for (const filter of noiseRemoval) {
  //     if (filter !== newFilter) {
  //       newNoiseSettings.push(filter);
  //     } else {
  //       clickedFilterIsActive = true;
  //     }
  //   }
  //   if (!clickedFilterIsActive) newNoiseSettings.push(newFilter);
  //   setNoiseRemoval(newNoiseSettings);

  //   let newSettings: imagePreProcessingOptions = {
  //     selectedChannels: selectedChannels,
  //     rotation: rotation,
  //     inversion: inversion,
  //     normalization: normalization,
  //     threshold: threshold,
  //     noiseRemoval: newNoiseSettings,
  //   }
  //   handleSettingsChange(newSettings);
  //   return;
  // }

  /**
   * Updates the parent element and worker of the new settings.
   * @param newSettings 
   */
  function handleSettingsChange(newSettings: imagePreProcessingOptions) {
    props.onSettingsChange(newSettings);
    updateWorker({
      target: "preprocessing settings",
      value: newSettings,
    } as WorkerInput);
  }
}

const preProcessingStyles = makeStyles(theme => ({
  root: {
    maxWidth: "100%",
    margin: "auto",
    marginTop: theme.spacing(2),
  },
  griditem: {
    margin: theme.spacing(1),
  },
  inputfield: {
    maxWidth: "100px",
  },
  info: {
    color: theme.palette.text.primary,
  },
}));