import React, { useState } from 'react';
import { useMountEffect } from "../../definitions"

import { makeStyles, createStyles, Theme, Grid } from '@material-ui/core';

import { ErrorBoundary } from '../Assorted/ErrorBoundary'
import { GelAndLaneManipulation } from './GelAndLaneProcessing/GelAndLaneManipulation';
import { useWorker, getEmptyWorkerContext } from '../../Workers/useWorker';
import { ChartView } from './LaneAnalysis/ChartView';
import {
  WorkerOutput as WOut, WorkerOutputSubscription as WSubscription, WorkerInput as WIn,
  ImageParameters, OVERLAY_Z_INDEX
} from '../../definitions';
import { LoadingAnimation } from '../Assorted/LoadingAnimation';

// .ts extension included to pass the tests
// @ts-ignore ts(2307)
// eslint-disable-next-line import/no-webpack-loader-syntax
import ProcessingWorker from "worker-loader!../../Workers/processing.worker.ts"

// The empty worker context helps to maintain typechecking
export const WorkerContext = React.createContext(getEmptyWorkerContext<WIn, WOut, WSubscription>());

enum Status {
  isInitializing,
  isWaiting,
  isReady,
}

/**
 * This component contains the gel analysis interface and logic plus the
 * display of the lane charts.
 * 
 * Props:
 * @param gel: the url of the image being analized in this component.
 */
export function MainView(props: {
  gel: string,
}) {

  // The status keeps track of whether the main thread has received the minimum
  // necessary information to start displaying the content.
  const [status, setStatus] = useState<Status>(Status.isInitializing)

  // Here we setup the worker, which will be passed on as context later.
  const setupMessage: WIn = {
    target: "original gel",
    value: props.gel,
  }
  const [
    subscribeToWorkerFor,
    updateWorker
  ] = useWorker<WIn, WOut, WSubscription>(ProcessingWorker, setupMessage);

  // The image parameters are needed for the generation of placeholder images
  // and for the use of the channel picker in case there are multiple channels.
  const [imageParameters, setImageParameters] = useState<ImageParameters>()
  useMountEffect(() => {

    subscribeToWorkerFor({
      target: "image parameters",
      callback: onImageParametersFromWW as WSubscription["callback"],
    });

    subscribeToWorkerFor({
      target: "processed gel",
      callback: onProcessedGelFromWW as WSubscription["callback"],
    });

  })

  const classes = useStyles();
  return (
    <WorkerContext.Provider value={[subscribeToWorkerFor, updateWorker]}>
      <Grid container spacing={0} className={classes.root}>

        {/* 
            The loading screen is shown while the web worker is initializing and while 
            waiting for the first gel to come back. 
        */}
        {(status === Status.isInitializing || status === Status.isWaiting) ?

          <div className={classes.animationWrapper}>
            <LoadingAnimation />
          </div>
          : <></>}

        {/* 
            The actual view, it is loaded behind the animation once it gets the image parameters.
            After the first gel arrives it is revealed with a delay to allow everything to
            render underneath.
        */}
        {((status === Status.isWaiting || status === Status.isReady) && imageParameters) ?
          <>
            <ErrorBoundary>
              <GelAndLaneManipulation components={imageParameters.components} size={imageParameters.size} />
            </ErrorBoundary>

            <ErrorBoundary>
              <ChartView />
            </ErrorBoundary>
          </>
          : <></>
        }

      </Grid>
    </WorkerContext.Provider>
  );

  /**
   * This function waits for new parameters to be sent by the web worker,
   * then updates its component with the data and new status.
   * @param parameters 
   */
  function onImageParametersFromWW(parameters: ImageParameters) {
    if (status === Status.isInitializing) {
      setStatus(Status.isWaiting);
      setImageParameters(parameters);
    }
  }

  /**
   * This function waits for the web worker to send the first processed gel,
   * at which point it waits 500ms and then updates the state of the view to
   * Status.isReady. This allows the underlying view time to render before closing
   * the animation.
   * @param processedGel 
   */
  function onProcessedGelFromWW(processedGel: string) {
    if (status !== Status.isReady) {
      setTimeout(() => setStatus(Status.isReady), 500)
    }
  }
}


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: "auto",
      marginTop: theme.spacing(2),
      [theme.breakpoints.down('xs')]: {
        maxWidth: "100%",
      },
      [theme.breakpoints.up('sm')]: {
        maxWidth: "90%",
      },
      [theme.breakpoints.up('md')]: {
        maxWidth: "75%",
      },
      [theme.breakpoints.up('lg')]: {
        maxWidth: "60%",
      },
      [theme.breakpoints.up('xl')]: {
        maxWidth: "50%",
      },
    },
    animationWrapper: {
      position: "fixed",
      margin: 0,
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "100%",
      backgroundColor: theme.palette.background.default,
      zIndex: OVERLAY_Z_INDEX,
    },
  }),
);