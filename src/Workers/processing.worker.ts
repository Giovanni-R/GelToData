import { Image } from 'image-js'
import {
  imagePreProcessingOptions, WorkerOutput, WorkerInput, WorkerJobTag, ImageParameters
} from "../definitions";
import {
  applyThresholdAndNormalizeImage, extractHistogram, convertToURL, getGreyImage, applyFilters,
} from "./worker.utilities";


// @ts-ignore
// eslint-disable-next-line no-restricted-globals
const w: Worker = self as any;

/**
 * The reference for the original image.
 * It should only be set at the beginning.
 */
let gel: Image;
/**
 * As the processing options change, this is updated and reflects the
 * latest result.
 */
let processedGel: Image;
/**
 * This is the URL generated for the processed gel,
 * it is released and updated every time that a new processedGel
 * is available.
 */
let dataURL: string;
/**
 * These are the generated URLs for the channel images.
 */
let channelURLs: string[] = new Array<string>(3);
/**
 * These are the preprocessing settings, 
 * they are updated by the main thread.
 */
let settings: imagePreProcessingOptions;
/**
 * These are the lane borders, which allows the worker to
 * extract the lane histograms. They mark vertical bands on
 * the image.
 */
let laneBorders: number[][] = [];
/**
 * computedLanes holds the lane histograms, split into channels.
 */
let computedLanes: number[][][];
/**
 * The referenceJob is the current job being executed against which every job
 * checks itself to determine which one has priority.
 */
let referenceJob: WorkerJobTag | undefined;
/**
 * jobPriority is the reference to determine the priority of
 * each kind of job.
 */
enum jobPriority {
  "original gel" = 20,
  "preprocessing settings" = 20,
  "selected lanes" = 10,
}
/**
 * Hidden variable which helps keeping track of relative job age,
 * it is accessed only though the jobCounter() helper function which
 * automatically increments its value. It must remain strictly monotonically increasing.
 */
let _jobCounter: number = 0;
/**
 * Helper function which assigns a counter to each job, it always returns a number
 * larger (more positive) than the one before.
 * It is strictly monotonically increasing. 
 */
function jobCounter() {
  const c = _jobCounter;
  _jobCounter += 1;
  return c;
}
/**
 * Readability variable. Return this when the job should be terminated.
 */
const terminateJob = true;
/**
 * Readability variable. Return this when the job should continue.
 */
const continueJob = false;

/**
 * The function that will handle messages from the parent thread.
 */
w.onmessage = async (event: MessageEvent) => {

  // The data should be of type WorkerInput
  const data = event.data as WorkerInput;

  // The job will be tagged to help juggle multiple async jobs.
  const currentJobTag: WorkerJobTag = {
    type: data.target,
    ID: data.interactionID ?? -1,
    timestamp: new Date(),
    priority: jobPriority[data.target],
    jobCounter: jobCounter(),
  }

  // Serialized objects lose some of their feature (like methods),
  // if any has been passed to the worker they must be rebuilt.
  switch (data.target) {

    case "original gel":
      // Recover the loaded file URL->Response->ArrayBuffer
      const imageData: ArrayBuffer = await (await fetch(data.value)).arrayBuffer()
      gel = await Image.load(imageData)

      // Comunicate back image parameters
      const parametersMessage: WorkerOutput = {
        target: "image parameters",
        value: {
          size: { width: gel.width, height: gel.height },
          components: gel.components,
          alpha: gel.alpha,
          bitDepth: gel.bitDepth,
        } as ImageParameters,
        interactionID: currentJobTag.ID,
      }
      w.postMessage(parametersMessage)
      break;

    case "preprocessing settings":
      settings = data.value as imagePreProcessingOptions;
      break;

    case "selected lanes":
      laneBorders = data.value as number[][];
      break;

    default:
      throw new Error("Error: worker received invalid message")
      break;
  }

  // Check that the minimum data needed is available
  if (!gel || !settings) return;

  processingPipeline(gel, settings, laneBorders, currentJobTag)
};

/**
 * This function takes care of determining the steps to be taken for each kind of job.
 * 
 * @param gel 
 * @param settings 
 * @param lanes 
 * @param currentJobTag 
 */
async function processingPipeline(
  gel: Image,
  settings: imagePreProcessingOptions,
  lanes: number[][],
  currentJobTag: WorkerJobTag
): Promise<void> {

  let shouldStop: boolean;

  if (await shouldNotContinue(currentJobTag)) return;

  switch (currentJobTag.type) {

    case "original gel":
      shouldStop = await processAndSendImage(gel, settings, currentJobTag);
      if (shouldStop) return;

      shouldStop = await extractComputedLanes(processedGel, lanes, settings.selectedChannels, currentJobTag);
      if (shouldStop) return;

      shouldStop = await generateAndSendChannelImages(processedGel, currentJobTag);
      if (shouldStop) return;
      break;

    case "preprocessing settings":
      shouldStop = await processAndSendImage(gel, settings, currentJobTag);
      if (shouldStop) return;

      shouldStop = await extractComputedLanes(processedGel, lanes, settings.selectedChannels, currentJobTag);
      if (shouldStop) return;

      shouldStop = await generateAndSendChannelImages(processedGel, currentJobTag);
      if (shouldStop) return;
      break;

    case "selected lanes":
      shouldStop = await extractComputedLanes(processedGel, lanes, settings.selectedChannels, currentJobTag);
      if (shouldStop) return;
      break;

    default:
      break;
  }

  // Clear the job once done.
  if (referenceJob && referenceJob.ID === currentJobTag.ID) {
    referenceJob = undefined;
  }
}

/**
 * This function yields the worker thread and 
 * then checks whether the job should resume or not.
 * 
 * The logic is appropriate for a processing pipeline where
 * different jobs affect the pipeline starting from different
 * points. This means that newer updates upstream 'reset' the
 * pipeline, while newer updates downstream need to wait for
 * the ones upstream to conclude to avoid interrupting work they
 * will rely on.
 * 
 * ```
 * (jobToCheck against reference)
 * 
 * Age      Priority    Outcome
 * 
 * Newer    Higher      Continue 
 * Newer    Lower       Wait (exponential backoff retry)
 * Newer    =           Continue 
 * =        Higher      Continue 
 * =        =           Continue (checks against itself fall here)
 * =        Lower       Terminate 
 * Older    Higher      Continue 
 * Older    Lower       Terminate 
 * Older    =           Terminate 
 * ```
 * 
 * @param jobToCheck 
 * @param backoffIndex (used internally, wait time is (10*2^backoffIndex)ms )
 */
async function shouldNotContinue(jobToCheck: WorkerJobTag, backoffIndex: number = 0
): Promise<boolean> {
  /**
   * Note that we are re-defining continueJob and terminateJob
   * in the function scope to allow for more complex behavior
   * and consistency (all are functions in this scope).
   */
  const continueJob = () => { referenceJob = jobToCheck; return false };
  const terminateJob = () => { return true };
  const yieldAndWait = () => shouldNotContinue(jobToCheck, backoffIndex + 1)

  // If there is no referenceJob, jobToCheck immediately becomes the new reference.
  if (!referenceJob) return continueJob();

  const backoffTimer = (backoffIndex) ? 10 * (2 ** backoffIndex) : 0;
  await new Promise(resolve => setTimeout(resolve, backoffTimer));

  // referenceJob might have completed in the meantime, check again.
  if (!referenceJob) return continueJob();

  // jobToCheck is:
  // Newer
  if (jobToCheck.jobCounter > referenceJob.jobCounter) {
    // Higher priority
    if (jobToCheck.priority > referenceJob.priority) {
      return continueJob();
    }
    // Equal priority
    else if (jobToCheck.priority === referenceJob.priority) {
      return continueJob();
    }
    // Lower priority
    else {
      return yieldAndWait()
    }
  }
  // Older
  else if (jobToCheck.jobCounter < referenceJob.jobCounter) {
    // Higher priority
    if (jobToCheck.priority > referenceJob.priority) {
      return continueJob();
    }
    // Equal priority
    else if (jobToCheck.priority === referenceJob.priority) {
      return terminateJob();
    }
    // Lower priority
    else {
      console.log(jobToCheck.ID, "<", referenceJob?.ID, "< <");
      return terminateJob();
    }
  }
  // Same age
  else {
    // Higher priority
    if (jobToCheck.priority > referenceJob.priority) {
      return continueJob();
    }
    // Equal priority
    else if (jobToCheck.priority === referenceJob.priority) {
      return continueJob();
    }
    // Lower priority
    else {
      console.log(jobToCheck.ID, "<", referenceJob?.ID, "= <");
      return terminateJob();
    }
  }
}

/**
 * The main processing step, takes care of most pre-processing and sending
 * the image to the main thread as an URL.
 * 
 * @param image 
 * @param settings 
 * @param currentJobTag 
 */
async function processAndSendImage(
  image: Image,
  settings: imagePreProcessingOptions,
  currentJobTag: WorkerJobTag
): Promise<boolean> {

  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  // Rotate
  const rotatedImage: Image = image.rotate(settings.rotation * 90);
  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  // Invert
  const invertedImage: Image = (settings.inversion) ? rotatedImage.invert() : rotatedImage;
  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  // Apply filters
  const filteredImage: Image = applyFilters(invertedImage, settings.noiseRemoval, settings.selectedChannels);

  // Normalize + threshold
  const fullColorProcessedImage: Image = applyThresholdAndNormalizeImage(
    filteredImage, settings.threshold, settings.normalization);
  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  // Store locally in the Web Worker
  processedGel = fullColorProcessedImage;

  // Convert to grey for the main thread to display
  const greyProcessedGel = getGreyImage(fullColorProcessedImage, settings.selectedChannels)
  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  // Generate new URL and free the previous one (encoded as a png)
  URL.revokeObjectURL(dataURL);
  dataURL = convertToURL(greyProcessedGel);

  const message: WorkerOutput = {
    target: "processed gel",
    interactionID: currentJobTag.ID,
    value: dataURL,
  };
  if (await shouldNotContinue(currentJobTag)) return terminateJob;
  w.postMessage(message);

  return continueJob;
}

/**
 * This function takes care of sending out the gray images of the channels
 * as URL.
 * 
 * @param image 
 * @param currentJobTag 
 */
async function generateAndSendChannelImages(
  image: Image, currentJobTag: WorkerJobTag
): Promise<boolean> {

  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  const numberOfChannels = 3;

  // If it's not an RGB image, skip this step.
  if (image.components !== numberOfChannels) return continueJob;

  // Split the image into its channels
  const stackedChannels = image.split({ preserveAlpha: false });

  // Generate new URLs and free the previous ones (encoded as a png)
  for (let i = 0; i < stackedChannels.length; i++) {
    URL.revokeObjectURL(channelURLs[i]);
    channelURLs[i] = convertToURL(stackedChannels[i])
  }

  const message: WorkerOutput = {
    target: "processed channels",
    interactionID: currentJobTag.ID,
    value: channelURLs,
  };

  if (await shouldNotContinue(currentJobTag)) return terminateJob;
  w.postMessage(message)

  return continueJob;
}

/**
 * This function takes in the image and the lane borders and computes the histograms
 * that will then be sent and displayed.
 * @param image 
 * @param laneBorders 
 * @param selectedChannels 
 * @param currentJobTag 
 */
async function extractComputedLanes(
  image: Image, laneBorders: number[][], selectedChannels: boolean[], currentJobTag: WorkerJobTag
): Promise<boolean> {

  // If the lanes are not yet available, skip this step.
  if (!laneBorders) return continueJob;

  // Check that no values exceed the width, in which case the new lanes probably 
  // have not caught up to the gel processing, they should be one of the waiting jobs.
  // Note that only this section of the job should stop.
  const maxBorderValue = Math.max(...laneBorders.map(laneBorder => Math.max(...laneBorder)));
  const minBorderValue = Math.min(...laneBorders.map(laneBorder => Math.min(...laneBorder)));
  if (minBorderValue < 0 || maxBorderValue > image.width) return continueJob;

  if (await shouldNotContinue(currentJobTag)) return terminateJob;

  const newComputedLanes: number[][][] = new Array<number[][]>(laneBorders.length);

  for (let i = 0; i < laneBorders.length; i++) {
    newComputedLanes[i] = extractHistogram(image, laneBorders[i], selectedChannels);
    if (await shouldNotContinue(currentJobTag)) return terminateJob;
  }

  computedLanes = newComputedLanes;

  const message: WorkerOutput = {
    target: "processed lanes",
    value: newComputedLanes,
    interactionID: currentJobTag.ID,
  }

  if (await shouldNotContinue(currentJobTag)) return terminateJob;
  w.postMessage(message)

  return continueJob;
}





