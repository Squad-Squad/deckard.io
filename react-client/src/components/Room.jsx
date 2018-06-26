import React from 'react';
import io from 'socket.io-client';
import $ from 'jquery';
import Tock from 'tocktimer';
import CurrentSelection from './CurrentSelection.jsx';
import sizeMe from 'react-sizeme';
import Confetti from 'react-confetti';
import LiveChat from './LiveChat.jsx';

class Room extends React.Component {
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
      nominateTimer: undefined,
      winner: {},
      // The hasVoted functionality has not yet been implemented
      hasVoted: false,
    };
    this.roomID = this.props.match.params.roomID;

    this.nominateRestaurant = this.nominateRestaurant.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.voteApprove = this.voteApprove.bind(this);
    this.voteVeto = this.voteVeto.bind(this);

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

    this.socket.on('nominate', nominee => {
      if (nominee.roomID === this.roomID) {
        console.log('Received nomination', nominee);
        this.setState({
          currentSelection: nominee.restaurant,
          hasVoted: false,
          isNominating: false,
        });
      }
      this.getNominateTimer();
      this.getVotes();
    });

    this.socket.on('join', roomID => {
      if (roomID === this.roomID) {
        console.log('Received new member');
        if (this.state.currentSelection) {
          this.socket.emit('nominate', { 'restaurant': this.state.currentSelection, 'roomID': this.roomID });
        }
      }
    })
  }

  /// Send post request to server to fetch room info when user visits link
  componentDidMount() {
    console.log('ROOM RENDERED');
    this.getMessages();
    this.getRoomInfo();
    this.getTimer();
    this.getNominateTimer();
    this.getVotes();
    this.socket.emit('join', this.roomID);
    this.getWinner();
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
      console.log(`Got roommembers: ${JSON.stringify(roomMembers)} from ${this.roomID}`)
      this.setState({
        members: roomMembers,
        roomName: roomMembers[0].rooms[0].name,
      });
    });
  }

  getWinner() {
    $.get(`/api/getWinner/${this.roomID}`).then(winner => {
      console.log('WINNER: ', winner);
      $.post('/api/search/restaurant', {
        restId: winner
      }).then((winner) => {
        this.setState({
          winner: winner
        })
      })
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
          })
        },
        complete: () => {
          this.getWinner();
        }
      });
      // console.log('STARTING TIMER');
      tock.start(timer.timeLeft + 1000);
    });
  }

  getNominateTimer() {
    $.get(`/api/nominatetimer/${this.roomID}`).then(timer => {
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
            nominateTimer: minutes + ':' + seconds
          })
        },
        complete: () => {
          this.setState({
            nominateTimer: undefined,
          })
        }
      });
      console.log('STARTING TIMER');
      tock.start(timer.timeLeft);
    });
  }

  getVotes() {
    $.get(`/api/votes/${this.roomID}`).then(restaurants => {
      let vetoedRests = this.state.vetoedRestaurants;
      for (let restaurant of restaurants) {
        console.log('THIS IS VETOED', restaurant)
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

  // Activated on click of RestaurantListItem component
  nominateRestaurant(restaurant, reloading = false) {
    console.log('hey joseph nominate', restaurant)
    if (this.state.isNominating) {
      this.setState({
        currentSelection: restaurant,
        isNominating: false,
      });
      if (!reloading) {
        let voteObj = {
          name: restaurant.name,
          roomID: this.roomID,
          restaurantID: restaurant.id,
        };
        console.log('vote', voteObj)
        let nomObj = {
          restaurant: restaurant,
          roomID: this.roomID,
        };
        $.post('/api/nominate', voteObj).then(() => {
          this.socket.emit('nominate', nomObj);
        });
      }
      // A user who nominates a restaurant should automatically vote for it
      // Socket is not refreshing table for some reason but still sends vote
      this.voteApprove(restaurant.name, restaurant.id, this.props.username);
    }
    setTimeout(() => console.log('NOMINATE SEL', this.state.currentSelection), 2000)
  }

  sendMessage(msg) {
    console.log('NOMINATE TIMER', this.state.nominateTimer);
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

  voteVeto() {
    if (!this.state.nominateTimer) {
      let resId = this.state.currentSelection.id;
      this.setState({
        isNominating: true,
      });
      if (this.state.currentSelection) {
        let voteObj = {
          voter: this.props.username,
          restaurant_id: resId,
          name: this.state.currentSelection.name,
          roomID: this.roomID,
        };
        console.log('INSIDE', voteObj)
        $.post('/api/vetoes', voteObj).then(() => {
          this.setState({
            currentSelection: undefined,
            hasVoted: true,
          });
          this.socket.emit('veto', voteObj);
        });
      }
    } else {
      let resId = this.state.currentSelection.id;
      if (this.state.currentSelection) {
        let voteObj = {
          voter: this.props.username,
          restaurant_id: resId,
          name: this.state.currentSelection.name,
          roomID: this.roomID,
        };
        console.log('INSIDE', voteObj)
        $.post('/api/vetoes', voteObj).then(() => {
          this.setState({
            hasVoted: true,
          });
          this.socket.emit('veto', voteObj);
        });
      }
    }
  }

  render() {
    // get size for confetti
    const { width, height } = this.props.size;
    return (
      <div>
        {this.state.winner.id ?
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <Confetti width={width} height={height} />
          </div> : ''}
        <section className="hero is-primary">
          <div className="hero-body">
            <div className="container">
              <h1 className="title">
                Welcome to Room {this.state.roomName}
              </h1>
              <h2 className="subtitle">
                <div>
                  Fighters: {this.state.members.map((user, index) => <span key={index}>{user.email} </span>)}
                </div>
              </h2>
            </div>
          </div>
        </section>
        <div className="columns">
          <article className="tile is-child notification">
            <LiveChat
              roomName={this.state.roomName}
              messages={this.state.messages}
              message={this.state.message}
              sendMessage={this.sendMessage}
            />
          </article>
        </div>
      </div>
    );
  }
}

// Create size config
const config = { monitorHeight: true }
// Call SizeMe with the config to get back the HOC.
const sizeMeHOC = sizeMe(config)
export default sizeMeHOC(Room)
