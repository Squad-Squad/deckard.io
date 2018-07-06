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
      roomHash: null
    };
    this.props.io.on('invitation', (data) => {
      console.log("INVITATION USERS:", data.host)
      for (var el of data.users) {
        if (el === this.props.loggedInUsername) {
          // console.log("WORD FROM THE OTHERSIDE:", data)
          this.setState({
            invite: true,
            inviteHost: data.host,
            roomHash: data.roomHash
          }, () => console.log("MAINVIEWINVITESTATE:", this.state.invite))
        }
      }
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
                {...props} />,
              <CreateRoomContainer
                searchUsers={this.props.searchUsers}
                searchedUsers={this.props.searchedUsers}
                loggedIn={this.props.loggedIn}
                loggedInUser={this.props.loggedInUser}
                userRooms={this.props.userRooms}
                io={this.props.io}
                {...props} />
            ]
        } />
        <Route path="/userprofile/:username" render={
          () => <ProfileContainer />} />

        <Route path="/rooms/:roomID" render={
          (props) =>
            [
              <Room
                searchUsers={this.props.searchUsers}
                searchedUsers={this.props.searchedUsers}
                loggedIn={this.props.loggedIn}
                loggedInUser={this.props.loggedInUser}
                userRooms={this.props.userRooms}
                io={this.props.io}
                {...props} />,
              <InviteDialogueModal
                handleClose={this.handleClose.bind(this)}
                addOpen={this.state.invite}
                host={this.state.inviteHost}
                {...props} />,
            ]
        } />
      </div>
    )
  }
}

const MainView = connect(mapStateToProps)(ConnectedMainView);


export default MainView;