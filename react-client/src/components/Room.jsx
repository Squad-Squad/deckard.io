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
    loggedInUsername: state.username,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addCurrUsersFromDB: (users) => dispatch(addCurrUsersFromDB(users)),
  };
};

class ConnectedRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      messages: [],
      memberMap: [],
      members: [],
      currentSelection: undefined,
      currentSelectionName: undefined,
      isNominating: true,
      votes: [],
      vetoedRestaurants: [],
      roomName: '',
      timer: '',
      winner: {},
    };
    this.roomID = this.props.match.params.roomID;

    this.sendMessage = this.sendMessage.bind(this);
    this.voteApprove = this.voteApprove.bind(this);

    // Client-side socket events
    // NEED THIS TO WORK ON DEPLOYMENT
    // this.props.io = io({ transports: ['websocket'] });
    // SERIOUSLY NEED ABOVE FOR DEPLOYMENT
    // DO NOT NEED TO SPECIFY PORT ON CLIENT SIDE

    this.props.io.on('chat', message => {
      // if (message.roomID === this.roomID) {
      //   console.log('Received message', message);
      console.log("MESSAGE IN CHAT :", message)
      this.setState({
        messages: [...this.state.messages, message.message],
      });
      this.getMessages();
      // }
    });

    this.props.io.on('vote', roomID => {
      if (roomID === this.roomID) {
        console.log('Received vote');
      }
    });

    this.props.io.on('veto', roomID => {
      if (roomID === this.roomID) {
        console.log('Received veto');
      }
    });

    // this.props.io.on('nominate', nominee => {
    //   if (nominee.roomID === this.roomID) {
    //     console.log('Received nomination', nominee);
    //     this.setState({
    //       currentSelection: nominee.restaurant,
    //       hasVoted: false,
    //       isNominating: false,
    //     });
    //   }
    //   this.getNominateTimer();
    //   this.getVotes();
    // });

    this.props.io.on('roomJoin', data => {
      // if (roomID === this.roomID) {
      //   console.log('Received new member');
      // if (this.state.currentSelection) {
      //   this.props.io.emit('nominate', { 'restaurant': this.state.currentSelection, 'roomID': this.roomID });
      // }
      // }

    })
  }

  /// Send post request to server to fetch room info when user visits link
  componentDidMount() {
    console.log('ROOM RENDERED', this.roomID);
    this.getMessages();
    this.getRoomInfo();
    this.getTimer();
    // this.getNominateTimer();
    // this.getVotes();
    this.props.io.emit('join', { room: this.roomID, user: this.props.loggedInUsername });
    // this.getWinner();
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
      // this.props.addCurrUsersFromDB(roomMembers);
      this.setState({
        memberMap: roomMembers.reduce((obj, memArr) => {
          obj[memArr.email] = memArr.alias;
          return obj;
        }, {}),
        members: roomMembers.map(member => member.alias),
        roomName: roomMembers[0].rooms[0].name,
      }, () => console.log(this.state.members));
    });
  }

  getTimer() {
    $.get(`/api/timer/${this.roomID}`).then(timer => {
      let tock = new Tock({
        countdown: true,
        interval: 100,
        callback: () => {
          let time = tock.lap();
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

  sendMessage(msg) {
    let messageObj = {
      message: {
        name: this.props.username || this.state.name,
        message: msg,
      },
      roomID: this.roomID,
    };
    $.post('/api/messages', messageObj).then(() => {
      this.props.io.emit('chat', messageObj);
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
      this.props.io.emit('vote', voteObj);
    });
    this.setState({
      hasVoted: true,
    });
  }

  render() {
    const { width, height } = this.props.size;

    const chatOrVote = () => {
      if (this.state.timer === "00:00") {
        return (<VotePanel members={this.state.members} io={this.props.io} />);
      } else {
        return (<LiveChat
          roomName={this.state.roomName}
          messages={this.state.messages}
          message={this.state.message}
          sendMessage={this.sendMessage}
          timer={this.state.timer}
          memberMap={this.state.memberMap} />);
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
