import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {
    usersInRoom: state.currRoomUsers,
  };
}

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  input: {
    display: 'none',
  },
  root: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
});

class VotePanel extends Component {
  render() {
    const { classes } = this.props;
    return (
      <Paper>
        {/* TOP BAR */}
        <div className={classes.root}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit" className={classes.flex}>
                Voting
              </Typography>
            </Toolbar>
          </AppBar>
        </div>

        {this.props.usersInRoom.map(user =>
          [<div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>{user}</div>
            <div>
              <Button variant="contained" color="primary" className={classes.button}>
                A.I.
              </Button>
              <Button variant="contained" color="secondary" className={classes.button}>
                Hyumon
              </Button>
            </div>
          </div>,
          <Divider />])}
      </Paper>
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VotePanel));