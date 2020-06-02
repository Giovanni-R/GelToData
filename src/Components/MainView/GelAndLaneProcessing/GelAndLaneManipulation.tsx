import React, { useState, useContext } from 'react';
import { useMountEffect, ImageSize } from "../../../definitions"

import { GelView } from './GelAndLaneView/GelView';
import { PreProcessing } from './PreProcessing/PreProcessing';
import { imagePreProcessingOptions, WorkerOutputSubscription, OVERLAY_Z_INDEX } from '../../../definitions';
import { WorkerContext } from '../MainView'
import { getSizedSVG } from '../../../utilities';
import { LoadingAnimation } from '../../Assorted/LoadingAnimation';

enum Status {
  isInitializing = "First render, initializing.",
  hasLoaded = "The image has loaded",
  isLoading = "The image is loading",
}

/**
 * This component contains the interface for the preprocessing steps and
 * allows the user to view the gel and set the lanes.
 * 
 * Props:
 * @param gel - the original image
 * @param onLaneSelection - the callback to pass the lanes up the component chain.
 */
export function GelAndLaneManipulation(props: {
  components: number,
  size: ImageSize,
}) {

  const [status, setStatus] = useState<Status>(Status.isInitializing)
  const [flipSize, setFlipSize] = useState<boolean>(false);
  const [dataURL, setImage] = useState<string>(getSizedSVG(props.size, `lightgray`, 1));

  const [subscribeToWorkerFor,] = useContext(WorkerContext);
  useMountEffect(() => {
    subscribeToWorkerFor({
      target: "processed gel",
      callback: onProcessedGelFromWW as WorkerOutputSubscription["callback"],
    })
  })

  // Rotation may have side effects downstream, passing the correct size along helps avoiding them.
  const trueSize = flipSize ? { width: props.size.height, height: props.size.width } : props.size

  return (
    <div>
      {/* 
          PreProcessing callbacks on any settings change
          so that its GelView can update appropriately.
      */}
      <PreProcessing
        components={props.components}
        onSettingsChange={handleSettingsChange}
        size={trueSize} />

      {/* 
          This component is passed a loading animation when settings change,
          it is removed when the newly processed gel arrives.
      */}
      <GelView
        imageDataURL={dataURL}
        size={trueSize}>
        {
          (status === Status.isLoading || status === Status.isInitializing) ?
            <LoadingAnimation zIndex={OVERLAY_Z_INDEX - 200} /> : <></>
        }
      </GelView>

    </div>
  );

  /**
   * A callback to keep track of changes in the settings that have side effects
   * like rotation which might ivalidate the current lanes.
   * @param newSettings 
   */
  function handleSettingsChange(newSettings: imagePreProcessingOptions) {
    setStatus(Status.isLoading)
    if (newSettings.rotation === 0 || newSettings.rotation === 2) {
      setFlipSize(false);
    } else {
      setFlipSize(true);
    }
  }

  /**
   * Callback for a web worker subscription that takes the new gel and
   * updates the component with it.
   * @param processedGel 
   */
  function onProcessedGelFromWW(processedGel: string) {
    setImage(processedGel);
    if (status !== Status.hasLoaded) setStatus(Status.hasLoaded);
  }
}