import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

const styles = {
  root: {
    flex: 1,
    marginTop: '200px',
  },
};

function LinearIndeterminate(props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <h1 style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
        fontSize: '25px',
        fontFamily: "'Titillium Web', sans-serif",
      }}>Waiting for other users to vote...</h1>
      <LinearProgress />
      <br />
      <LinearProgress color="secondary" />
    </div>
  );
}

LinearIndeterminate.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LinearIndeterminate);