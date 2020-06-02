import React from 'react';

import { Grid, Paper, Typography } from '@material-ui/core';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { Palette, InvertColors } from '@material-ui/icons';


import { ImageSelector } from './ImageSelector';
import { InlineButton } from './InlineButton';

/**
 * A component which displays the App's welcome screen.
 * 
 * @param props 
 */
export function WelcomeScreen(props: {
  isFirstVisit: boolean,
  onFileLoad: (files: (FileList | null)) => void,
  onSampleLoad: (file: string) => void
}) {

  const classes = useStyles();
  return (
    <Grid container spacing={3} className={classes.root}>

      <Grid container item direction="row" justify="center" alignItems="center">
        <Typography variant="h4" align="center">
          Welcome to GelToData!
        </Typography>
      </Grid>

      <Grid container item direction="row" justify="center" alignItems="center">
        <Typography variant="h6" align="center" color="textSecondary">
          {(props.isFirstVisit) ? "A simple way to extract quantitative data from gel electrophoresis images." : "Nice to see you back! Ready for another one?"}
        </Typography>
      </Grid>

      <Grid container item direction="row" justify="center" alignItems="center">
        <ImageSelector onFileLoad={props.onFileLoad} />
      </Grid>

      <Grid container item direction="row" justify="center" alignItems="center">
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="body1">
              Things that might interest you:<br />
            </Typography>
            <Typography variant="body1">
              ✔ This website works entirely offline.<br />
              ✔ No data is trasmitted to any server.<br />
              ✔ The charts are written in D3, with the code organized in hooks.<br />
              ✔ This website uses Web Workers to process your gels in the background through a typechecked interface.<br />
              ✔ Image manipulation is mainly done using image-js and preserves the information of high bit-depth images.<br />
            </Typography>
          </Paper>

        </Grid>
      </Grid>

      <Grid container item direction="row" justify="center" alignItems="center">
        <Typography variant="body1" align="center" color="textSecondary">
          Don't have a gel handy? <br />Try this{" "}
          <InlineButton onClick={() => props.onSampleLoad("./rgb.png")}>RGB <sub><Palette fontSize="small" /></sub></InlineButton>
          {" "}sample or its{" "}
          <InlineButton onClick={() => props.onSampleLoad("./bw.png")}>BW <sub><InvertColors fontSize="small" /></sub></InlineButton>
          {" "}version!<br />
        </Typography>
      </Grid>

    </Grid >
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      maxWidth: "100%",
      height: "100%",
      margin: "auto",
      marginTop: "15%",
    },
    paper: {
      margin: theme.spacing(0),
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  }),
);