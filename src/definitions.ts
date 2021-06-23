import { useEffect, useLayoutEffect } from "react";

export type rotationOptions = (0 | 1 | 2 | 3); // Clockwise (0=0, 1=90, 2=180, 3=270)
export type filterOptions = (1); // Median

export interface imagePreProcessingOptions {
  selectedChannels: boolean[],
  rotation: rotationOptions,
  inversion: boolean,
  normalization: boolean,
  threshold: number,
  noiseRemoval: filterOptions[],
};

export const DEFAULT_PREPROCESSING_SETTINGS = {
  selectedChannels: [true, true, true],
  rotation: 0,
  inversion: false,
  normalization: false,
  threshold: 0,
  noiseRemoval: [],
} as imagePreProcessingOptions;

export type ImageSize = {
  width: number,
  height: number,
}

export declare enum BitDepth {
  BINARY = 1,
  UINT8 = 8,
  UINT16 = 16,
  FLOAT32 = 32
}
type BinaryValue = (0 | 1)
export interface ImageParameters {
  size: ImageSize,
  components: number,
  alpha: BinaryValue,
  bitDepth: BitDepth,
};

export interface WorkerJobTag {
  /**
   * Identifies the type of job being done.
   */
  type: WorkerInput["target"],
  /**
   * Identifies an istance of a job being done.
   * When automatically generated, it is a random number between 0 and 1
   */
  ID: WorkerInput["interactionID"],
  /**
   * Records the time when the worker received the job request,
   * or the job was created.
   */
  timestamp: Date,
  /**
   * Helps resolve executing priority when multiple jobs are being done by the worker at the same time.
   */
  priority: number,
  /**
   * Timestamps can actually result equal (as in, not more than nor less than one another) between very
   * close jobs. A counter can be deterministically increased and helps keeping track of job age for the
   * purposes of comparisons and concurrency resolution.
   */
  jobCounter: number,
}

export type WorkerInput = ({
  /**
   * Identifies the job the worker will perform 
   * or input the worker will receive.
   */
  target: "original gel",
  /**
   * The input data the worker needs.
   */
  value: string,
  /**
   * Identifies the interaction when a message will directly lead to a reply.
   * When automatically generated, it is a random number between 0 and 1
   */
  interactionID?: number,
} | {
  target: "preprocessing settings",
  value: imagePreProcessingOptions,
  interactionID?: number,
} | {
  target: "selected lanes",
  value: number[][],
  interactionID?: number,
});

export type WorkerOutput = ({
  /**
   * Identifies the worker output or the job done.
   */
  target: "processed gel",
  /**
   * The output data of the worker.
   */
  value: string,
  /**
   * Identifies the interaction when a message will directly lead to a reply.
   * When automatically generated, it is a random number between 0 and 1
   */
  interactionID?: number,
} | {
  target: "processed channels",
  value: string[],
  interactionID?: number,
} | {
  target: "processed lanes",
  value: number[][][],
  interactionID?: number,
} | {
  target: "image parameters",
  value: ImageParameters,
  interactionID?: number,
});

export type WorkerOutputSubscription = ({
  /**
   * The output the user wishes to subscribe to.
   */
  target: "processed gel",
  /**
   * The callback that will handle the worker output.
   */
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
} | {
  target: "processed channels",
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
} | {
  target: "processed lanes",
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
} | {
  target: "image parameters",
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
});

export const OVERLAY_Z_INDEX = 10000;
export const ACCEPTED_FILE_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/tiff"];

/**
 * Exactly the same as useEffect, but with 0 dependencies.
 * Makes the fact that the effect will execute only once upon mounting 
 * (as there are no changing dependency values) clear and avoids linting warnings.
 * @param callback 
 */
// eslint-disable-next-line react-hooks/exhaustive-deps
export const useMountEffect = (callback: () => (void | (() => void | undefined))) => useEffect(callback, [])
/**
 * Exactly the same as useLayoutEffect, but with 0 dependencies.
 * Makes the fact that the effect will execute only once upon mounting 
 * (as there are no changing dependency values) clear and avoids linting warnings.
 * @param callback 
 */
// eslint-disable-next-line react-hooks/exhaustive-deps
export const useMountLayoutEffect = (callback: () => (void | (() => void | undefined))) => useLayoutEffect(callback, [])
