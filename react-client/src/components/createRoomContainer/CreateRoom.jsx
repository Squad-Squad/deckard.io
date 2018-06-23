import React from 'react';
import $ from 'jquery';
import CombatantsContainer from './CombatantsContainer.jsx';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return { loggedIn: state.loggedIn };
};

class ConnectedCreateRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      roomID: null,
      roomName: '',

      error: false,

      roomLink: ''
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.createRoom = this.createRoom.bind(this);
  }

  createRoom() {
    if (this.props.loggedIn === false ||
      this.state.roomName.length === 0 ||
      this.props.combatants.length === 0) {
      this.setState({
        error: true,
      });
    } else {
      $.post(
        '/api/save',
        {
          roomName: this.state.roomName,
          members: this.props.combatants
        },
        (roomInfo, status) => {
          console.log('ROOMINFO', roomInfo);
          console.log(`Room ${this.state.roomName} saved to the database:`, status);
          this.sendRoomEmail(roomInfo, this.props.combatants);
          this.setState({
            roomLink: roomInfo.uniqueid
          }, () => {
            this.props.history.push(`/rooms/${roomInfo.uniqueid}`)
          });
        },
      )
    }
  }

  sendRoomEmail(roomInfo, members) {
    members.forEach(email => {
      $.post('/api/roomEmail',
        {
          email: email,
          roomInfo: roomInfo
        },
        (data, status) => {
          console.log('Room emails sent!', status);
        });
    });
  }

  updateQuery(e) {
    this.setState({
      query: e.target.value,
    });
  }

  updateRoomName(e) {
    this.setState({
      roomName: e.target.value,
    });
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.createRoom();
    }
  }

  render() {
    var uniqueURL = this.state.roomID ?
      `https://food-fight-greenfield.herokuapp.com/rooms/${this.state.roomID}`
      : '';

    // Error creating room
    const createRoomError = () => {
      if (!this.props.loggedIn) {
        return (
          <section className="section login-error" style={{ color: 'white' }}>
            <div className="container">
              <h2 className="subtitle">
                Please login to create a room.
              </h2>
            </div>
          </section>
        )
      } else {
        return this.state.error ? (
          <section className="section login-error" style={{ color: 'white' }}>
            <div className="container">
              <h2 className="subtitle">
                You must have a name and the arena must have combatants.
              </h2>
            </div>
          </section>
        ) : null;
      }
    };

    return (
      <div>
        <div>
          <p className="title">
            Create Your Arena
          </p>
          {createRoomError()}
          <div className="columns">
            <div className="column is-three-quarters">
              <div className="field">
                <label className="label">Name</label>
                <p className="control is-expanded">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Arena name..."
                    value={this.state.roomName}
                    onChange={this.updateRoomName.bind(this)}
                    onKeyPress={this.handleKeyPress} />
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="is-divider" />
        <CombatantsContainer
          combatants={this.props.combatants} />
        <div id="create-room-footer">
          <div>
            <div className="is-divider" />
            <button
              id="fight-button"
              onClick={this.createRoom}
              className="button is-primary is-large is-fullwidth">
              Fight!
              </button>
          </div>
        </div >
      </div >
    );
  }
}

const CreateRoom = connect(mapStateToProps)(ConnectedCreateRoom);

export default withRouter(CreateRoom);
