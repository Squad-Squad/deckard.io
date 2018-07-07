import React from 'react';
import $ from 'jquery';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import TextField from '@material-ui/core/TextField';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import CombatantsContainer from './CombatantsContainer.jsx';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import RoomOptions from './RoomOptions.jsx';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { addUserToNewRoom } from '../../../../redux/actions.js';

const mapStateToProps = state => {
  return {
    loggedIn: state.loggedIn,
    loggedInUsername: state.username,
    usersForNewRoom: state.usersForNewRoom,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUserToNewRoom: (username) => dispatch(addUserToNewRoom(username)),
  };
};

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2,
    paddingBottom: '0px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    marginTop: 30,
    backgroundColor: 'rgba(33, 33, 33, 0.5)',
  },
  container: {
    flexGrow: 1,
    position: 'relative',
    height: 250,
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  newRoomButton: {
    width: '100%',
  },
  input: {
    fontSize: '16px',
  }
});

class ConnectedCreateRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      roomID: null,
      roomName: '',
      roomLink: '',
      currSuggestions: [],
      value: '',

      nameError: false,
      optionsError: '',

      modeAnchorEl: null,
      botAnchorEl: null,
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.createRoom = this.createRoom.bind(this);
    this.updateRoomName = this.updateRoomName.bind(this);
    this.renderSuggestion = this.renderSuggestion.bind(this);
  }

  componentDidMount() {
    this.props.addUserToNewRoom(this.props.loggedInUsername);
  }

  //
  // ─── AUTOCOMPLETE LOGIC ─────────────────────────────────────────────────────────
  //
  renderInput(inputProps) {
    const { classes, ref, ...other } = inputProps;

    return (
      <TextField
        fullWidth
        InputProps={{
          inputRef: ref,
          classes: {
            input: classes.input,
          },
          ...other,
        }}
      />
    );
  }

  renderSuggestion(suggestion, { query, isHighlighted }) {
    const props = this.props;
    const clearInput = () => this.setState({
      query: '',
    });
    const matches = match(suggestion, query);
    const parts = parse(suggestion, matches);

    return (
      <MenuItem selected={isHighlighted}
        component="div"
        onClick={() => {
          if (this.props.usersForNewRoom.length <= 7) {
            props.addUserToNewRoom(suggestion);
            console.log(this.state.query);
            this.setState({
              currSuggestions: [],
              query: '',
            });
          }
        }}>
        <div>
          {parts.map(function (part, index) {
            return part.highlight ? (
              <span
                key={String(index)}
                style={{ fontWeight: 300 }}>
                {part.text}
              </span>
            ) : (
                <strong key={String(index)} style={{ fontWeight: 500 }}>
                  {part.text}
                </strong>
              );
          })}
        </div>
      </MenuItem>
    );
  }

  renderSuggestionsContainer(options) {
    const { containerProps, children } = options;

    return (
      <Paper {...containerProps} square>
        {children}
      </Paper>
    );
  }

  getSuggestionValue(suggestion) {
    return suggestion;
  }

  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    let count = 0;

    return inputLength === 0
      ? []
      : this.props.onlineUsers.filter(suggestion => {
        const keep =
          count < 5 && suggestion.toLowerCase().slice(0, inputLength) === inputValue;

        if (keep) {
          count += 1;
        }

        return keep;
      });
  }

  handleSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      currSuggestions: this.getSuggestions(value),
    });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      currSuggestions: [],
    });
  };
  // ────────────────────────────────────────────────────────────────────────────────

  createRoom() {
    if (this.state.roomName.length === 0) {
      this.setState({
        nameError: true,
      });
    } else if (this.state.roomName.length === 0) {
      this.setState({
        nameError: true,
      });
    } else {
      $.post(
        '/api/save',
        {
          roomName: this.state.roomName,
          members: this.props.usersForNewRoom,
          roomMode: this.props.roomModeSelection
        },
        (roomInfo, status) => {
          this.sendRoomEmail(roomInfo, this.props.usersForNewRoom);
          this.setState({
            roomLink: roomInfo.uniqueid
          }, () => {
            this.props.history.push(`/rooms/${roomInfo.uniqueid}`)
            this.props.io.emit('invite', { users: this.props.usersForNewRoom, roomHash: roomInfo.uniqueid, roomName: this.state.roomName, roomMode: this.props.roomModeSelection })
          });
        }
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

  updateQuery(e, { newValue }) {
    this.setState({
      query: newValue,
    });
  }

  updateRoomName(e) {
    this.setState({
      roomName: e.target.value,
    });
  }

  handleAutoSuggestKeyPress(event) {
    if (event.key == 'Enter') {
      console.log('IS IT ENTER');
      if (this.state.query.length &&
        this.props.usersForNewRoom.length <= 7) {
        this.props.addUserToNewRoom(this.state.currSuggestions[0]);
        this.setState({
          currSuggestions: [],
          query: '',
        })
      }
    }
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.createRoom();
    }
  }

  render() {
    const { classes } = this.props;
    const { anchorEl } = this.state;

    const { vertical, horizontal, open } = this.state;

    var uniqueURL = this.state.roomID ?
      `https://food-fight-greenfield.herokuapp.com/rooms/${this.state.roomID}`
      : '';

    // Error creating room
    const createRoomError = () => {
      return this.state.error ? (
        <section className="section login-error" style={{ color: 'white' }}>
          <p>
            Your room must have a name.
          </p>
        </section>
      ) : null;
    };

    return (
      <Paper className={classes.paper}>
        <Typography id="new-room-header" style={{ paddingBottom: '8px' }}>
          New Room
        </Typography>
        {/* <Button variant="contained"
          onClick={this.props.freeRoomMode}
          color="secondary"
          style={{ marginTop: '15px' }}>
          Free for All
        </Button>
        <Button variant="contained"
          onClick={this.props.roundRoomMode}
          color="secondary"
          style={{ marginTop: '15px' }}>
          Round Robin
          </Button> */}

        <Divider />
        {createRoomError()}

        <RoomOptions
          freeRoomMode={this.props.freeRoomMode}
          roundRoomMode={this.props.roundRoomMode} />

        <div style={{ margin: '8px' }}>
          <FormControl style={{ width: '100%' }} >
            <Input
              style={{ fontSize: '16px' }}
              value={this.state.roomName}
              onChange={this.updateRoomName}
              placeholder="Room Name"
            />
          </FormControl>
        </div>

        <div style={{ margin: '8px', height: '40px' }}>
          <Autosuggest
            theme={{
              container: classes.container,
              suggestionsContainerOpen: classes.suggestionsContainerOpen,
              suggestionsList: classes.suggestionsList,
              suggestion: classes.suggestion,
              margin: classes.margin,
            }}
            renderInputComponent={this.renderInput}
            suggestions={this.state.currSuggestions}
            onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
            onSuggestionsClearRequested={() => { }}
            renderSuggestionsContainer={this.renderSuggestionsContainer}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            inputProps={{
              classes,
              placeholder: 'Search Online Users',
              value: this.state.query,
              onChange: this.updateQuery.bind(this),
              onKeyPress: this.handleAutoSuggestKeyPress.bind(this),
            }}
          />
        </div>


        <CombatantsContainer />


        <Button variant="contained"
          color="secondary"
          className={classes.newRoomButton}
          onClick={this.createRoom}
          style={{
            marginTop: '15px',
            borderRadius: '0px',
            width: 'calc(100% + 32px)',
            marginLeft: '-16px',
            height: '40px',
          }}>
          Create New Room
        </Button>
      </Paper>
    );
  }
}

const CreateRoom = connect(mapStateToProps, mapDispatchToProps)(ConnectedCreateRoom);

export default withStyles(styles)(withRouter(CreateRoom));
