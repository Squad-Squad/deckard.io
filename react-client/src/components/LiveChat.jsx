import React from 'react';
import ReactDOM from 'react-dom';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { withStyles } from '@material-ui/core/styles';

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

class LiveChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
    }
  }

  componentDidMount() {
    this.scrollToBottom();
    console.log('MESSAGES', this.props.messages);
  }

  updateMessage(e) {
    this.setState({
      msg: e.target.value,
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
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
      <Paper id="chat-window">
        <div className={classes.root}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit" className={classes.flex}>
                {this.props.roomName}
              </Typography>
              <Typography variant="title" color="inherit">
                {this.props.timer}
              </Typography>
            </Toolbar>
          </AppBar>
        </div>
        <div className="chat-messages" ref={(el) => { this.messageList = el; }}>
          {this.props.messages.map(message => {
            if (this.props.username === message.name) {
              return (<div className="section"
                style={{ textAlign: "right", borderTop: "1px solid black", padding: "5px" }}>
                <p>{message.message}</p>
              </div>)
            } else {
              return (<div className="section"
                style={{ textAlign: "left", borderTop: "1px solid black", padding: "5px" }}>
                <p><strong>{message.name}:</strong>{message.message}</p>
              </div>)
            }
          })}
        </div>
        <BottomNavigation
          // value={value}
          onChange={this.handleChange}
          showLabels>
          <span>
            <input
              type="text"
              className="input is-primary is-small is-rounded"
              value={this.state.msg}
              onChange={this.updateMessage.bind(this)}
              onKeyPress={this.handleKeyPress.bind(this)}
              style={{ width: '450px', marginTop: '15px', marginRight: '15px' }}
            />
          </span>
          <button
            onClick={this.handleClick.bind(this)}
            className="button is-outlined is-primary is-small send-message"
            style={{ marginTop: '15px' }}>
            Send
            </button>
        </BottomNavigation>
        {/* <div>
          <span>
            <input
              type="text"
              className="input is-primary is-small is-rounded"
              value={this.state.msg}
              onChange={this.updateMessage.bind(this)}
              onKeyPress={this.handleKeyPress.bind(this)}
              style={{ width: '450px', marginTop: '15px', marginRight: '15px' }}
            />
          </span>
          <button
            onClick={this.handleClick.bind(this)}
            className="button is-outlined is-primary is-small send-message"
            style={{ marginTop: '15px' }}>
            Send
            </button>
        </div> */}
      </Paper>
    );
  }
}

export default withStyles(styles)(LiveChat);