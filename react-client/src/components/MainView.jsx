import React from 'react';
import CreateRoomContainer from './createRoomContainer/CreateRoomContainer.jsx';
import Room from './room/Room.jsx';
import InviteDialogueModal from './inviteDialogueModal/InviteDialogueModal.jsx'
import { Route } from 'react-router-dom';
import ProfileContainer from './profileAndStats/ProfileContainer.jsx';
import { closeAboutDialog } from '../../../redux/actions';
import { connect } from 'react-redux';
import axios from 'axios';
import AboutDialogue from './AboutDialogue.jsx'
import { login } from '../../../redux/actions';


const mapStateToProps = state => {
  return {
    loggedInUsername: state.username,
    searchedUsers: state.searchedUsers,
    aboutDialogOpen: state.aboutDialogOpen
  };
};

const mapDispatchToProps = dispatch => {
  return {
    login: (username, email, isGoogleAccount, avatarURL, description) => {
      return dispatch(login(username, email, isGoogleAccount, avatarURL, description));
    },
    closeAboutDialog: () => dispatch(closeAboutDialog()),
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
      messages: [],
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
    })

    this.props.io.on('return option', (data) => {
      console.log("RETURN OPTION", data)
    })

    this.props.io.on('chat', messages => {
      this.setState({
        messages: messages
      });
    });


    this.freeRoomMode = this.freeRoomMode.bind(this, "free")
    this.roundRoomMode = this.roundRoomMode.bind(this, "round")
    this.decline = this.decline.bind(this)

  }

  async componentDidMount() {
    this.setState({
      loggedInUser: this.props.loggedInUsername
    });
    this.props.io.emit('username connect', this.props.loggedInUsername)
    this.props.io.emit('leaveRoom', this.props.loggedInUsername)
    console.log("THINGS");

    const res = await axios.get('/checklogin');
    console.log('RES', res);
    if (res.data.user) {
      this.props.login(res.data.user.username,
        res.data.user.email,
        res.data.user.is_google_account,
        res.data.user.avatar,
        res.data.user.description,
        res.data.user.friends);
    }
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
    console.log("ARGUMETS", arguments[0])
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
        <AboutDialogue
          openStatus={this.props.aboutDialogOpen}
          handleCloseAbout={this.props.closeAboutDialog}
        />
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
                roundRoomMode={this.roundRoomMode.bind(this, 'round')}
                freeRoomMode={this.freeRoomMode.bind(this, 'free')}
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
                messages={this.state.messages}
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

const MainView = connect(mapStateToProps, mapDispatchToProps)(ConnectedMainView);


export default MainView;