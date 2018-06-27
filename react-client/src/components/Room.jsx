import React from 'react';
import io from 'socket.io-client';
import $ from 'jquery';
import Tock from 'tocktimer';
import sizeMe from 'react-sizeme';
import Confetti from 'react-confetti';
import LiveChat from './LiveChat.jsx';
import VotePanel from './VotePanel.jsx';
import { addCurrUsersFromDB } from '../../../redux/actions';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addCurrUsersFromDB: (users) => dispatch(addCurrUsersFromDB(users)),
  };
}

class ConnectedRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      messages: [],
      members: [],
      currentSelection: undefined,
      currentSelectionName: undefined,
      isNominating: true,
      votes: [],
      vetoedRestaurants: [],
      roomName: '',
      timer: '',
      winner: {},
      // The hasVoted functionality has not yet been implemented
      hasVoted: false,
    };
    this.roomID = this.props.match.params.roomID;

    this.sendMessage = this.sendMessage.bind(this);
    this.voteApprove = this.voteApprove.bind(this);

    // Client-side socket events
    // NEED THIS TO WORK ON DEPLOYMENT
    this.socket = io({ transports: ['websocket'] });
    // SERIOUSLY NEED ABOVE FOR DEPLOYMENT
    // DO NOT NEED TO SPECIFY PORT ON CLIENT SIDE

    this.socket.on('chat', message => {
      if (message.roomID === this.roomID) {
        console.log('Received message', message);
        this.setState({
          messages: [...this.state.messages, message.message],
        });
        this.getMessages();
      }
    });

    this.socket.on('vote', roomID => {
      if (roomID === this.roomID) {
        console.log('Received vote');
        this.getVotes();
      }
    });

    this.socket.on('veto', roomID => {
      if (roomID === this.roomID) {
        console.log('Received veto');
        this.getVotes();
      }
    });

  }

  /// Send post request to server to fetch room info when user visits link
  componentDidMount() {
    console.log('ROOM RENDERED');
    this.getMessages();
    this.getRoomInfo();
    this.getTimer();
    this.getVotes();
    this.socket.emit('join', this.roomID);
  }

  getMessages() {
    $.get(`/api/messages/${this.roomID}`).then(messages => {
      this.setState({
        messages: messages,
      });
    });
  }

  getRoomInfo() {
    $.get(`/api/rooms/${this.roomID}`).then(roomMembers => {
      console.log(`Got roommembers: ${JSON.stringify(roomMembers)} from ${this.roomID}`);
      this.props.addCurrUsersFromDB(roomMembers);
      this.setState({
        roomName: roomMembers[0].rooms[0].name,
      });
    });
  }

  getTimer() {
    $.get(`/api/timer/${this.roomID}`).then(timer => {
      let tock = new Tock({
        countdown: true,
        interval: 100,
        callback: () => {
          let time = tock.lap()
          let seconds = (Math.floor((time / 1000) % 60));
          let minutes = (Math.floor((time / (60000)) % 60));
          seconds = (seconds < 10) ? "0" + seconds : seconds;
          minutes = (minutes < 10) ? "0" + minutes : minutes;

          this.setState({
            timer: minutes + ':' + seconds
          });
        },
      });

      // console.log('STARTING TIMER');
      tock.start(timer.timeLeft + 1000);
    });
  }

  getVotes() {
    $.get(`/api/votes/${this.roomID}`).then(restaurants => {
      let vetoedRests = this.state.vetoedRestaurants;
      for (let restaurant of restaurants) {
        if (restaurant.vetoed === true) {
          vetoedRests.push(restaurant.restaurant_id);
        }
      }
      console.log('hey vetoed!!', vetoedRests)

      this.setState({
        votes: restaurants,
        vetoedRestaurants: vetoedRests,
      });

      if (restaurants.length && !this.state.currentSelection) {
        restaurants.forEach(restaurant => {
          if (!restaurant.vetoed) {
            this.setState({
              currentSelectionName: restaurant.name,
            });
          }
        });
      }
    });
  }

  sendMessage(msg) {
    let messageObj = {
      message: {
        name: this.props.username || this.state.name,
        message: msg,
      },
      roomID: this.roomID,
    };
    $.post('/api/messages', messageObj).then(() => {
      this.socket.emit('chat', messageObj);
    });
  }

  // Update from text boxes in the live chat

  voteApprove(name, id, uname) {
    let resName = name || this.state.currentSelection.name;
    let resId = id || this.state.currentSelection.id;
    let voteObj = {
      voter: this.props.username,
      restaurant_id: resId,
      name: resName,
      roomID: this.roomID,
      nominator: uname
    };
    $.post('/api/votes', voteObj).then(() => {
      this.socket.emit('vote', voteObj);
    });
    this.setState({
      hasVoted: true,
    });
  }

  render() {
    const { width, height } = this.props.size;

    const chatOrVote = () => {
      if (this.state.timer === "00:00") {
        return (<VotePanel />);
      } else {
        return (<LiveChat
          roomName={this.state.roomName}
          messages={this.state.messages}
          message={this.state.message}
          sendMessage={this.sendMessage}
          timer={this.state.timer} />);
      }
    }

    return (
      <div>
        {this.state.winner.id ?
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <Confetti width={width} height={height} />
          </div> : ''}
        <div className="columns">
          <div className="column is-2"></div>
          <div className="column is-8">
            {chatOrVote()}
          </div>
        </div>
      </div>
    );
  }
}

// Create size config
const config = { monitorHeight: true }
// Call SizeMe with the config to get back the HOC.
const sizeMeHOC = sizeMe(config)

const Room = connect(mapStateToProps, mapDispatchToProps)(ConnectedRoom);

export default sizeMeHOC(Room)
