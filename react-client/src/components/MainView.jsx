import React from 'react';
import Hero from './Hero.jsx';
import CreateRoomContainer from './createRoomContainer/CreateRoomContainer.jsx';
import Room from './Room.jsx';
import { Route } from 'react-router-dom';

class MainView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedInUser: '',
    }
  }

  componentDidMount() {
    this.setState({
      loggedInUser: this.props.loggedInUser
    });
    console.log('MAINVIEW', this.props.loggedInUser)
  }

  render() {
    return (
      <div>
        <Route exact path="/" render={
          (props) => <CreateRoomContainer
            searchUsers={this.props.searchUsers}
            searchedUsers={this.props.searchedUsers}
            loggedIn={this.props.loggedIn}
            loggedInUser={this.props.loggedInUser}
            userRooms={this.props.userRooms}
            {...props} />
        } />
        <Route path="/rooms/:roomID" render={
           (props) => <Room
            searchUsers={this.props.searchUsers}
            searchedUsers={this.props.searchedUsers}
            loggedIn={this.props.loggedIn}
            loggedInUser={this.props.loggedInUser}
            userRooms={this.props.userRooms}
            io={this.props.io}
            {...props} />
        } />
      </div>
    )
  }
}

export default MainView;