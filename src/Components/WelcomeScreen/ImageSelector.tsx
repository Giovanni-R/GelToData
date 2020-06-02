import React from "react";

import { makeStyles, Button } from "@material-ui/core";
import { ACCEPTED_FILE_TYPES } from "../../definitions";

/**
 * This component implements a simple material-ui button for file input by the user.
 * 
 * @param onFileLoad: callback for when a change is detected.
 */
export function ImageSelector(props: {
  onFileLoad: (files: (FileList | null)) => void,
}) {
  const classes = imageSelectorStyles();
  return (
    <label title="File Import" className={classes.label}>
      <input
        type="file"
        name="image import"
        id="image import"
        accept={ACCEPTED_FILE_TYPES.join(", ")}
        className={classes.fileinput}
        size={0.1}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onFileLoad(e.target.files)} />
      <Button variant="contained" className={classes.button}>Import image</Button>
    </label>
  )
}



const imageSelectorStyles = makeStyles(theme => ({
  fileinput: {
    right: "100%",
    bottom: "100%",
    opacity: 0.01,
    position: "fixed",
  },
  label: {
    cursor: "pointer",
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
  },
  button: {
    pointerEvents: "none",
  },
}));