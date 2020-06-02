import React, { ReactNode } from "react";

import { makeStyles } from "@material-ui/core";

/**
 * This component implements a simple in line button for use
 * in the middle of displayed text.
 * 
 * @param onClick: callback for when a click is registered
 */
export function InlineButton(props: {
  onClick: () => void,
  children: ReactNode,
}) {
  const classes = inlineButtonStyles();
  return (
    <span className={classes.button} onClick={props.onClick}>{props.children}</span>
  )
}

const inlineButtonStyles = makeStyles(theme => ({
  button: {
    cursor: "pointer",
    color: "#3f51b5",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));