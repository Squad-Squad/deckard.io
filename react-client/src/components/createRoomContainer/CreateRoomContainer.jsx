import React from 'react';
import axios from 'axios';
import { withStyles } from '@material-ui/core/styles';
import CreateRoom from './CreateRoom.jsx';
import FriendsList from './FriendsList.jsx';
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
      combatants: Array(0),
      onlineUsers: [],
    };
  }

  async componentDidMount() {
    // Get online users
    const res = await axios.post('/searchUsers');
    this.setState({
      onlineUsers: res.data
        .filter(user => (user !== this.props.loggedInUsername)),
    });

    axios.post('/searchUsers')
      .then(res => {
        this.setState({
          onlineUsers: res.data
            .filter(user => (user !== this.props.loggedInUsername)),
        });
      });
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
      this.setState(prevState => ({
        combatants: [...prevState.combatants, email],
      }));
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <div className="columns" style={{ display: 'flex', flexWrap: 'wrap-reverse' }}>
          <div className="column is-1 hide-if-small"></div>
          <div className="column is-4">
            <FriendsList
              onlineUsers={this.state.onlineUsers} />
          </div>
          <div className="column is-6">
            <CreateRoom
              io={this.props.io}
              onlineUsers={this.state.onlineUsers}
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


