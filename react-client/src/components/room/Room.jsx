import React from 'react';
import io from 'socket.io-client';
import $ from 'jquery';
import Tock from 'tocktimer';
import sizeMe from 'react-sizeme';
import Confetti from 'react-confetti';
import LiveChat from './LiveChat.jsx';
import VotePanel from './VotePanel.jsx';
import Scores from './Scores.jsx';
import { addCurrUsersFromDB } from '../../../../redux/actions';
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
      roomName: '',
      timer: '',
      scores: null,
    };
    this.roomID = this.props.match.params.roomID;

    this.sendMessage = this.sendMessage.bind(this);
    // this.voteApprove = this.voteApprove.bind(this);

    this.props.io.on('chat', messages => {
      console.log("MESSAGE IN CHAT :", messages)
      this.setState({
        messages: messages
      }, ()=>{console.log("this.state.messages in room:", this.state.messages)});
    });

    this.props.io.on('vote', roomID => {
      if (roomID === this.roomID) {
        console.log('Received vote');
      }
    });


    this.props.io.on('scores', scores => {
      console.log('RECEIVING SCORES');
      this.setState({
        scores
      });
    });


  }

  /// Send post request to server to fetch room info when user visits link
  componentDidMount() {
    // this.getMessages();
    this.getRoomInfo();
    this.getTimer();
    // this.props.io.emit('join', { room: this.roomID, user: this.state.memberMap[this.props.loggedInUsername]});
  }

  // getMessages() {
  //   // $.get(`/api/messages/${this.roomID}`).then(messages => {
  //   //   this.setState({
  //   //     messages: messages,
  //   //   }, () => console.log('message format state received:', messages));
  //   // });
  //   this.props.io.emit('roomStart')
  // }

  getRoomInfo() {
    $.get(`/api/rooms/${this.roomID}`).then(roomMembers => {
      // console.log(`Got roommembers: ${JSON.stringify(roomMembers)} from ${this.roomID}`);
      console.log("GET ROOM INFO RECEIVING OBJ:", roomMembers);


      let aliasedMembers = [];
      let memberMap = {};
      for (var key in roomMembers) {
        if (key !== "room") {
          memberMap[key] = roomMembers[key]
          aliasedMembers.push(roomMembers[key])
        }
      };

      console.log("STATE OF THE DATA BEFORE SETSTATE: memberMAP:", memberMap, "aliasedMembers:", aliasedMembers)

      this.setState({
        memberMap: memberMap,
        members: aliasedMembers,
        roomName: roomMembers.room,
      }, () => console.log("WHAT ROOMMEMBERS NEED TO LOOK LIKE:", this.state.memberMap)
      );
    })
      .then(() => {
        this.props.io.emit('join', { room: this.roomID, user: this.state.memberMap[this.props.loggedInUsername] });
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
      numUsers: this.state.members.length,
      message: {
        name: this.props.username || this.state.name,
        message: msg,
      },
      roomID: this.roomID,
    };
    // $.post('/api/messages', messageObj).then(() => {
      this.props.io.emit('chat', messageObj);
    // });
  }

  // Update from text boxes in the live chat

  // voteApprove(name, id, uname) {
  //   let resName = name || this.state.currentSelection.name;
  //   let resId = id || this.state.currentSelection.id;
  //   let voteObj = {
  //     voter: this.props.username,
  //     // restaurant_id: resId,
  //     name: resName,
  //     roomID: this.roomID,
  //     nominator: uname
  //   };
  //   $.post('/api/votes', voteObj).then(() => {
  //     this.props.io.emit('vote', voteObj);
  //   });
  //   this.setState({
  //     hasVoted: true,
  //   });
  // }

  render() {
    const { width, height } = this.props.size;

    const chatOrVote = () => {
      if (this.state.timer === "00:00" && !this.state.scores) {
        return (<VotePanel members={this.state.members}
          memberMap={this.state.memberMap} io={this.props.io} />);
      } else if (!this.state.scores) {
        return (<LiveChat
          roomName={this.state.roomName}
          messages={this.state.messages}
          message={this.state.message}
          sendMessage={this.sendMessage}
          timer={this.state.timer}
          memberMap={this.state.memberMap} />);
      } else {
        return (
          <Scores
            scores={this.state.scores} memberMap={this.state.memberMap} />
        )
      }
    }

    return (
      <div>
        <div className="columns">
          <div className="column is-2 hide-if-small"></div>
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
