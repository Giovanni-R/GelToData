import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { HelpOutline } from '@material-ui/icons';
import { Tooltip } from '@material-ui/core';

/**
 * A questionmark displaying useful information in a tooltip.
 * 
 * @param props 
 * @param title - the content to be displayed in the tooltip
 * @param inline - enable if the tooltip is in the middle of some text.
 */
export function InfoTooltip(props: {
  title: JSX.Element,
  inline?: boolean,
}) {

  const displayInline = props.inline ?? true;

  const classes = infoTooltipStyles();
  return (
    <Tooltip
      className={(displayInline) ? classes.inline : classes.absolute}
      title={props.title}
      interactive
      leaveDelay={300}
      arrow
    >
      <sub><sub><HelpOutline /></sub></sub>
    </Tooltip>
  )

}

const infoTooltipStyles = makeStyles((theme) => ({
  inline: {
    color: theme.palette.text.primary,
  },
  absolute: {
    position: "absolute",
    color: theme.palette.text.primary,
    right: "-30px",
  },
}));