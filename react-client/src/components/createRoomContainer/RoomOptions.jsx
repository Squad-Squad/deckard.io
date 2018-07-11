import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { chooseRoomMode, chooseRoomBot, chooseRoomLength } from '../../../../redux/actions';

function mapStateToProps(state) {
  return {

  };
}

function mapDispatchToProps(dispatch) {
  return {
    chooseRoomMode: mode => dispatch(chooseRoomMode(mode)),
    chooseRoomBot: bot => dispatch(chooseRoomBot(bot)),
    chooseRoomLength: length => dispatch(chooseRoomLength(length)),
  };
}

const styles = theme => ({
  button: {
    height: '32px !important',
    padding: '0px'
  },
  mitsukuLabel: {
    height: '8px',
  }
});

class RoomOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modeAnchorEl: null,
      botAnchorEl: null,
      timeAnchorEl: null,

      selectedMode: '',
      selectedBot: '',
      selectedTime: 0,

      width: 0,
      height: 0,
    };
  }

  componentDidMount() {
    this.updateWindowDimensions.call(this);
  }

  updateWindowDimensions() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  handleModeClick(event) {
    this.setState({ modeAnchorEl: event.currentTarget });
  }

  handleModeClose() {
    this.setState({ modeAnchorEl: null });
  }

  selectRoundRobin() {
    this.props.roundRoomMode();
    this.props.chooseRoomMode('Round Robin');
    this.setState({
      modeAnchorEl: null,
      selectedMode: (this.state.height <= 930) ? 'R.R.' : 'Round Robin',
    });
  }

  selectFreeForAll() {
    this.props.freeRoomMode();
    this.props.chooseRoomMode('Free For All');
    this.setState({
      modeAnchorEl: null,
      selectedMode: (this.state.height <= 930) ? 'F.F.A.' : 'Free For All',
    });
  }

  handleBotClick(event) {
    this.setState({ botAnchorEl: event.currentTarget });
  }

  handleBotClose() {
    this.setState({ botAnchorEl: null });
  }

  selectMitsuku() {
    this.props.chooseRoomBot('Mitsuku');
    this.setState({
      botAnchorEl: null,
      selectedBot: 'Mitsuku',
    });
  }

  handleTimeClick(event) {
    this.setState({ timeAnchorEl: event.currentTarget });
  }

  handleTimeClose() {
    this.setState({ timeAnchorEl: null });
  }

  select4Mins() {
    this.props.chooseRoomLength('4');
    this.setState({
      timeAnchorEl: null,
      selectedTime: '4',
    });
  }

  select8Mins() {
    this.props.chooseRoomLength('8');
    this.setState({
      timeAnchorEl: null,
      selectedTime: '8',
    });
  }


  render() {
    const { classes } = this.props;

    const modeButton = () => {
      if (this.state.selectedMode) {
        return (
          <Button
            className={classes.button}
            aria-owns={this.state.modeAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleModeClick.bind(this)}
          >
            {this.state.selectedMode}
          </Button>
        )
      } else {
        return (
          <Button
            className={classes.button}
            aria-owns={this.state.modeAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleModeClick.bind(this)}
          >
            Mode
            <ExpandMoreIcon />
          </Button>
        )
      }
    }

    const botButton = () => {
      if (this.state.selectedBot === 'Mitsuku') {
        return (
          <Button
            classes={{ label: classes.mitsukuLabel }}
            className={classes.button}
            aria-owns={this.state.botAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleBotClick.bind(this)}
          >
            <img
              src={'https://scontent-dfw5-2.xx.fbcdn.net/v/t1.0-1/p480x480/22815569_1610453235678754_6569553918937179856_n.jpg?_nc_cat=0&oh=c72c42a7efd0217e548c4c669e715755&oe=5BDF2C75'}
              style={{
                objectFit: 'cover',
                borderRadius: '50%',
                height: '32px',
                width: '32px',
                marginRight: '10px'
              }} />
            {this.state.selectedBot}
          </Button>
        )
      } else {
        return (
          <Button
            className={classes.button}
            aria-owns={this.state.botAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleBotClick.bind(this)}
          >
            Bot
            <ExpandMoreIcon />
          </Button>
        )
      }
    }

    const timeButton = () => {
      if (this.state.selectedTime) {
        return (
          <Button
            className={classes.button}
            aria-owns={this.state.timeAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleTimeClick.bind(this)}
          >
            {this.state.selectedTime}&nbsp;mins
          </Button>
        )
      } else {
        return (
          <Button
            className={classes.button}
            aria-owns={this.state.timeAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleTimeClick.bind(this)}
          >
            Length
            <ExpandMoreIcon />
          </Button>
        )
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: '10px',
          marginBottom: '5px'
        }}>
        <div style={{ flex: 1 }}>
          {modeButton()}
          <Menu
            id="simple-menu"
            anchorEl={this.state.modeAnchorEl}
            open={Boolean(this.state.modeAnchorEl)}
            onClose={this.handleModeClose.bind(this)}
          >
            <MenuItem onClick={this.selectRoundRobin.bind(this)}>Round Robin</MenuItem>
            <MenuItem onClick={this.selectFreeForAll.bind(this)}>Free For All</MenuItem>
          </Menu>
        </div>
        <div style={{ flex: 1 }}>
          {botButton()}
          <Menu
            id="simple-menu"
            anchorEl={this.state.botAnchorEl}
            open={Boolean(this.state.botAnchorEl)}
            onClose={this.handleBotClose.bind(this)}
          >
            <MenuItem onClick={this.selectMitsuku.bind(this)}>
              <img
                src={'https://scontent-dfw5-2.xx.fbcdn.net/v/t1.0-1/p480x480/22815569_1610453235678754_6569553918937179856_n.jpg?_nc_cat=0&oh=c72c42a7efd0217e548c4c669e715755&oe=5BDF2C75'}
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%',
                  height: '32px',
                  width: '32px',
                  marginRight: '10px'
                }} />
              Mitsuku
            </MenuItem>
          </Menu>
        </div>
        <div style={{ flex: 1 }}>
          {timeButton()}
          <Menu
            id="simple-menu"
            anchorEl={this.state.timeAnchorEl}
            open={Boolean(this.state.timeAnchorEl)}
            onClose={this.handleTimeClose.bind(this)}
          >
            <MenuItem onClick={this.select4Mins.bind(this)}>4 mins</MenuItem>
            <MenuItem onClick={this.select8Mins.bind(this)}>8 mins</MenuItem>
          </Menu>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(RoomOptions));