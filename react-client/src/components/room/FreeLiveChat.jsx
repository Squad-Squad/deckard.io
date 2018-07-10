import React from 'react';
import ReactDOM from 'react-dom';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import Button from '@material-ui/core/Button';
import PublishIcon from '@material-ui/icons/Publish';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import axios from 'axios'
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username,
    usersInRoom: state.usersForNewRoom,
  };
};

const styles = {
  root: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
};

class ConnectedFreeLiveChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
    };
  }

  componentDidMount() {
    console.log("AM I MOUNTING", this.props.roomID)
    this.scrollToBottom();
    // axios.post('/api/startTimer', {roomID: this.props.roomID})
    // this.props.getTimer()

  }

  updateMessage(e) {
    this.setState({
      msg: e.target.value,
    });
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.messages) !== JSON.stringify(prevProps.messages)) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const scrollHeight = this.messageList.scrollHeight;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    ReactDOM.findDOMNode(this.messageList).scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      if (this.state.msg) this.props.sendMessage(this.state.msg);
      this.setState({
        msg: ''
      })
    }
  }

  handleClick() {
    if (this.state.msg) this.props.sendMessage(this.state.msg);
    this.setState({
      msg: ''
    })
  }

  render() {
    const { classes } = this.props;
    return (
      <Paper
        id="chat-window"
        style={{ backgroundColor: 'rgba(0,0,0,.4)' }}>

        {/* TOP BAR */}
        <div className={classes.root}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit" className={classes.flex}
                style={{ fontWeight: 600 }}>
                {this.props.roomName}
              </Typography>
              <Typography variant="title" color="inherit"
                style={{ fontWeight: 600 }}>
                {this.props.timer}
              </Typography>
            </Toolbar>
          </AppBar>
        </div>

        {/* MESSAGE LIST */}
        <div className="chat-messages" ref={(el) => { this.messageList = el; }}>
          {this.props.messages.map((message, i) => {
            if (this.props.username === message.name) {
              return (<div className="section" key={i}
                style={{ textAlign: "right", borderTop: "1px solid black", padding: "17px", fontSize: "18px" }}>
                <p>{message.message}</p>
              </div>)
            } else {
              return (<div className="section" key={i}
                style={{ textAlign: "left", borderTop: "1px solid black", padding: "17px", fontSize: "18px" }}>
                <p><strong>{this.props.memberMap[message.name]}
                  {(() => this.props.memberMap[message.name] ? ':' : null)()}&nbsp;</strong>{message.message}</p>
              </div>)
            }
          })}
        </div>

        {/* BOTTOM BAR */}
        <BottomNavigation
          onChange={this.handleChange}>
          <FormControl style={{ width: '70%' }}>
            <Input
              style={{ marginTop: '10px' }}
              fullWidth
              value={this.state.msg}
              onChange={this.updateMessage.bind(this)}
              onKeyPress={this.handleKeyPress.bind(this)}
              inputProps={{
                 maxLength: 100,
              }}
            />
          </FormControl>
          <Button variant="fab" color="primary" aria-label="add" className={classes.button}
            onClick={this.handleClick.bind(this)}>
            <PublishIcon />
          </Button>
        </BottomNavigation>
      </Paper>
    );
  }
}

const FreeLiveChat = connect(mapStateToProps)(ConnectedFreeLiveChat);

export default withStyles(styles)(FreeLiveChat);