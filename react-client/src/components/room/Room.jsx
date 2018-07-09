import React from 'react';
import io from 'socket.io-client';
import $ from 'jquery';
import Tock from 'tocktimer';
import sizeMe from 'react-sizeme';
import Confetti from 'react-confetti';
import FreeLiveChat from './FreeLiveChat.jsx';
import RoundLiveChat from './RoundLiveChat.jsx';
import VotePanel from './VotePanel.jsx';
import Scores from './Scores.jsx';
import AwaitingResults from './AwaitingResults.jsx';
import axios from 'axios'
import { addCurrUsersFromDB } from '../../../../redux/actions';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username,
    loggedInUsername: state.username,
    usersForNewRoom: state.usersForNewRoom,

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
      roomMode: this.props.roomMode,
      waitingForRoomMembers: true,
      yourTurn: false,
      // whoseTurn: null
    };
    this.roomID = this.props.match.params.roomID;
    this.getTimer = this.getTimer.bind(this)
    this.sendMessage = this.sendMessage.bind(this);
    // this.voteApprove = this.voteApprove.bind(this);

    this.props.io.on('chat', messages => {
      console.log("MESSAGE IN CHAT :", messages)
      this.setState({
        messages: messages
      }, () => { console.log("this.state.messages in room:", this.state.messages) });
    });


    this.props.io.on('scores', scores => {
      console.log('RECEIVING SCORES');
      this.setState({
        scores
      });
    });

    this.props.io.on('yourTurn', player => {
      console.log("your turn", player, "!!!!")
      this.setState({
        yourTurn: true,
        // timer: "00:15"
      })
    })

    this.props.io.on('turnOver', player => {
      console.log("your turn's over", player, "!!!!")
      this.setState({
        yourTurn: false,
      })
    })

    this.props.io.on('roomReady', data => {
      this.setState({
        waitingForRoomMembers: false
      })
    })

    // this.props.io.on('whose turn', (data)=>{
    //   console.log('username of turn', data, "!!!!", "and alias:", this.props.memberMap[data])
    //   this.setState({
    //     whoseTurn: this.state.memberMap[data]
    //   })
    // })

  }



  /// Send post request to server to fetch room info when user visits link
  componentDidMount() {
    console.log("CURRENT ROOM MODE:", this.state.roomMode)
    console.log("current state of waitingForRoomMembers:", this.state.waitingForRoomMembers)
    this.getRoomInfo();
    // if(this.state.roomMode === "free"){
    // axios.post('/api/startTimer', {roomID: this.props.roomID}) 
    this.getTimer()
    // }
  }


  getRoomInfo() {
    $.get(`/api/rooms/${this.roomID}`).then(roomMembers => {
      console.log("GET ROOM INFO RECEIVING OBJ:", roomMembers);


      let aliasedMembers = [];
      let memberMap = {};
      for (var key in roomMembers) {
        if (key !== "room" && key !== "roomMode") {
          memberMap[key] = roomMembers[key]
          aliasedMembers.push(roomMembers[key])
        }
      };

      this.setState({
        roomMode: roomMembers.roomMode,
        memberMap: memberMap,
        members: aliasedMembers,
        roomName: roomMembers.room,
      });
    })
      .then(() => {
        this.props.io.emit('join', { roomID: this.roomID, user: this.state.memberMap[this.props.loggedInUsername], mitsuku: this.state.memberMap['mitsuku@mitsuku.com'], roomMode: this.state.roomMode });
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

      console.log('STARTING TIMER');
      tock.start(timer.timeLeft + 1000);
    });
  }

  sendMessage(msg) {
    let messageObj = {
      roomMode: this.state.roomMode,
      numUsers: this.state.members.length,
      message: {
        name: this.props.username || this.state.name,
        message: msg,
      },
      roomID: this.roomID,
    };
    this.props.io.emit('chat', messageObj);
  }

  // Update from text boxes in the live chat


  render() {
    const { width, height } = this.props.size;

    const freechatOrVote = () => {
      // this.getTimer();
      if (this.state.timer === "00:00" && !this.state.scores) {
        return (<VotePanel members={this.state.members}
          roomID={this.roomID} 
          memberMap={this.state.memberMap} io={this.props.io} />);
      } else if (!this.state.scores) {
        return (<FreeLiveChat
          roomName={this.state.roomName}
          messages={this.state.messages}
          roomID={this.roomID}
          message={this.state.message}
          sendMessage={this.sendMessage}
          getTimer={this.getTimer}
          timer={this.state.timer}
          memberMap={this.state.memberMap} />);
      } else {
        return (
          <Scores
            scores={this.state.scores} memberMap={this.state.memberMap} />
        )
      }
    }

    const roundchatOrVote = () => {
      if (this.state.waitingForRoomMembers) {
        return (<AwaitingResults members={true} />)
      } else {
        if (this.state.timer === "00:00" && !this.state.scores) {
          return (<VotePanel members={this.state.members}
            roomID={this.roomID} 
            memberMap={this.state.memberMap} io={this.props.io} />);
        } else if (!this.state.scores) {
          return (<RoundLiveChat
            alias={this.state.memberMap[this.props.loggedInUsername]}
            io={this.props.io}
            yourTurn={this.state.yourTurn}
            // whoseTurn={this.state.whoseTurn}
            roomName={this.state.roomName}
            roomID={this.roomID}
            messages={this.state.messages}
            message={this.state.message}
            sendMessage={this.sendMessage}
            getTimer={this.getTimer}
            timer={this.state.timer}
            memberMap={this.state.memberMap} />);
        } else {
          return (
            <Scores
              scores={this.state.scores} memberMap={this.state.memberMap} />
          )
        }
      }
    }

    return (
      <div>
        <div className="columns">
          <div className="column is-2 hide-if-small"></div>
          <div className="column is-8">
            {(() => {
              switch (this.state.roomMode) {
                case "round":
                  return roundchatOrVote()
                  break;
                case "free":
                  return freechatOrVote()
                  break;
              }
            })()}
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
