import React from 'react';
import CreateRoomContainer from './createRoomContainer/CreateRoomContainer.jsx';
import Room from './room/Room.jsx';
import InviteDialogueModal from './inviteDialogueModal/InviteDialogueModal.jsx'
import { Route } from 'react-router-dom';
import ProfileContainer from './profileAndStats/ProfileContainer.jsx';
import { connect } from 'react-redux';


const mapStateToProps = state => {
  return {
    loggedInUsername: state.username,
    searchedUsers: state.searchedUsers,
  };
};

class ConnectedMainView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedInUser: '',
      invite: false,
      inviteHost: null,
      roomHash: null,
      roomMode: "free",

    };
    this.props.io.on('invitation', (data) => {
      for (var el of data.users) {
        if (el === this.props.loggedInUsername) {
          this.setState({
            invite: true,
            inviteHost: data.host,
            roomHash: data.roomHash,
            roomMode: data.roomMode,
          });
        }
      }

      this.freeRoomMode = this.freeRoomMode.bind(this, "free")
      this.roundRoomMode = this.roundRoomMode.bind(this, "round")
      this.decline = this.decline.bind(this)
    })
  }

  componentDidMount() {
    this.setState({
      loggedInUser: this.props.loggedInUsername
    });
    this.props.io.emit('username connect', this.props.loggedInUsername)
    this.props.io.emit('leaveRoom', this.props.loggedInUsername)
  }

  handleOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ invite: false });
  };


  freeRoomMode() {
    this.setState({
      roomMode: arguments[0]
    })
  }

  roundRoomMode() {
    this.setState({
      roomMode: arguments[0]
    })
  }

  decline() {
    this.props.io.emit('decline', { user: this.props.loggedInUsername, roomID: this.state.roomHash, roomMode: this.state.roomMode })
    this.setState({ invite: false })

  }


  render() {
    return (
      <div>
        <Route exact path="/" render={
          (props) =>
            [
              <InviteDialogueModal
                handleClose={this.handleClose.bind(this)}
                addOpen={this.state.invite}
                host={this.state.inviteHost}
                roomHash={this.state.roomHash}
                decline={this.decline}
                {...props}
                key={1} />,
              <CreateRoomContainer
                searchUsers={this.props.searchUsers}
                searchedUsers={this.props.searchedUsers}
                loggedIn={this.props.loggedIn}
                loggedInUser={this.props.loggedInUser}
                userRooms={this.props.userRooms}
                io={this.props.io}
                roundRoomMode={this.roundRoomMode}
                freeRoomMode={this.freeRoomMode}
                roomModeSelection={this.state.roomMode}
                {...props}
                key={2} />
            ]
        } />
        <Route path="/userprofile/:username" render={
          () => <ProfileContainer />} />

        <Route path="/rooms/:roomID" render={
          (props) =>
            [
              <Room key={1}
                searchUsers={this.props.searchUsers}
                searchedUsers={this.props.searchedUsers}
                loggedIn={this.props.loggedIn}
                loggedInUser={this.props.loggedInUser}
                userRooms={this.props.userRooms}
                io={this.props.io}
                roomMode={this.state.roomMode}
                {...props} />,
              <InviteDialogueModal key={2}
                handleClose={this.handleClose.bind(this)}
                addOpen={this.state.invite}
                host={this.state.inviteHost}
                decline={this.decline}
                {...props} />,
            ]
        } />
      </div>
    )
  }
}

const MainView = connect(mapStateToProps)(ConnectedMainView);


export default MainView;