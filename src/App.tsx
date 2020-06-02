import React, { useState } from 'react';

import { CssBaseline, makeStyles, Theme, createStyles } from '@material-ui/core';

import { MainView } from './Components/MainView/MainView';
import { ErrorBoundary } from './Components/Assorted/ErrorBoundary';
import { WelcomeScreen } from './Components/WelcomeScreen/WelcomeScreen';
import { ACCEPTED_FILE_TYPES } from './definitions';

enum Status {
  welcomeScreen,
  gelManipulation,
  newGelSelection,
}

/**
 * The wrapper for the entire application, also handles the user input.
 * 
 * State:
 * @param imageList: a list of imported and parsed images.
 * @param status: an indicator to monitor the state the app is in.
 */
function App() {
  const [imageURLs, setImageURLs] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>(Status.welcomeScreen);


  const classes = useStyles();
  return (
    <div className={classes.root}>
      {(Status.welcomeScreen === status) ?
        <WelcomeScreen
          isFirstVisit={true}
          onFileLoad={handleFileSelection}
          onSampleLoad={handleSampleSelection} /> : <></>}

      {(Status.gelManipulation === status) ?
        <ErrorBoundary>
          <MainView gel={imageURLs[0]} />
        </ErrorBoundary>
        : <div></div>}

      {(Status.newGelSelection === status) ?
        <WelcomeScreen
          isFirstVisit={false}
          onFileLoad={handleFileSelection}
          onSampleLoad={handleSampleSelection} /> : <></>}
      <CssBaseline />
    </div>
  );


  async function handleFileSelection(files: (FileList | null)) {
    if (!files) return;

    // Revoke any previously assigned URLs.
    imageURLs.map((url, i) => URL.revokeObjectURL(url));

    let newFileURLs = new Array<string>(files.length);
    for (let i = 0; i < newFileURLs.length; i++) {

      // If a file of the wrong type is detected, stop.
      if (!ACCEPTED_FILE_TYPES.includes(files[i].type)) return;

      newFileURLs[i] = URL.createObjectURL(files[i]);
    }

    setImageURLs(newFileURLs);
    setStatus(Status.gelManipulation);
  }

  async function handleSampleSelection(fileURL: string) {
    setImageURLs([fileURL]);
    setStatus(Status.gelManipulation);
  }
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      maxWidth: "100%",
      height: "100%",
    },
  }),
);


export default App;