import React from 'react';
import Hero from './Hero.jsx';
import CreateRoomContainer from './createRoomContainer/CreateRoomContainer.jsx';
import Room from './Room.jsx';
import { Route } from 'react-router-dom';
import { connect } from 'react-redux'


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
    }
    this.props.io.on('invitation', (data)=>{
      console.log("INVITATION USERS:", data.users)
      for(var el of data.users){
        // console.log("IS THIS A FOR LOOP OR NOT", el)
        if(el === this.props.loggedInUsername){
          console.log('USERNAME HIT:', el)
          console.log("WORD FROM THE OTHERSIDE:", data)
        }
      }
    })
  }  

  componentDidMount() {
    console.log('PROPS in MainView:', this.props)
    this.setState({
      loggedInUser: this.props.loggedInUsername
    });
    console.log('MAINVIEW', this.props.loggedInUsername)
  this.props.io.emit('username connect', this.props.loggedInUsername)

    
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
            io={this.props.io}
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

const MainView = connect(mapStateToProps)(ConnectedMainView);


export default MainView;