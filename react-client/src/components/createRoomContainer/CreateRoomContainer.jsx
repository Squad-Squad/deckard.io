import React from 'react';
import axios from 'axios';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import CreateRoom from './CreateRoom.jsx';
import UserRooms from './UserRooms.jsx';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
});

class CreateRoomContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      combatants: Array(0)
    };
  }

  componentWillReceiveProps(newProps) {
    if (newProps.loggedInUser &&
      !this.state.combatants.includes(newProps.loggedInUser)) {
      this.addCombatant(newProps.loggedInUser);
    } else if (newProps.loggedInUser === '') {
      this.setState({
        combatants: Array(0)
      });
    }
  }

  addCombatant(email) {
    if (!this.state.combatants.includes(email)) {
      this.setState({
        combatants: [...this.state.combatants, email]
      });
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <Grid container className={classes.root} spacing={16}>
        <Grid container spacing={24}>
          <Grid item xs={3}>
          </Grid>
          <Grid item xs={6}>
            <CreateRoom></CreateRoom>
          </Grid>
        </Grid>
      </Grid>
    )
  }
}

export default withStyles(styles)(CreateRoomContainer);


