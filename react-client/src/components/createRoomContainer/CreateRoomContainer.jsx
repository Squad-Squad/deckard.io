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
      <div>
        <div className="columns">
          <div className="column is-2 hide-if-small"></div>
          <div className="column is-8">
            <CreateRoom 
            io={this.props.io}
            freeRoomMode={this.props.freeRoomMode}
            roundRoomMode={this.props.roundRoomMode}
            roomModeSelection={this.props.roomModeSelection}
            >
            </CreateRoom>
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(CreateRoomContainer);


