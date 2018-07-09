import * as React from 'react';
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
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  currentTurnBar: {
    height: '40px',
    fontSize: '20px',
    fontWeight: 600,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#424242',
    padding: '0px 60px'
  },
  currentTurnText: {
    fontSize: '18px',
  },

};

type Props = {
  username: string,
  usersInRoom: array,
}

class ConnectedRoundLiveChat extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
      yourTurn: this.props.yourTurn

    };

    this.props.io.on('turn over', (data) => {
      console.log('YOUR TURNs over', data, "!!!!")
      this.setState({
          yourTurn: false       
      }) 
    }) 
    
    this.props.io.on('whose turn', (data)=>{
      console.log('username of turn', data, "!!!!", "and alias:", this.props.memberMap[data])
      this.setState({
        whoseTurn: this.props.memberMap[data]
      })
    })
  }

  componentDidMount() {
    console.log("WHEN AM I HAPPENING ROUND LIVE CHAT INITIALIZE")
    this.scrollToBottom();
    axios.post('/api/startTimer', {roomID: this.props.roomID})
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
      this.props.io.emit('turn done', { user: this.props.username, message: this.state.msg })
      if (this.state.msg) this.props.sendMessage(this.state.msg);
      this.setState({
        msg: ''
      })
    }
  }

  handleClick() {
    console.log("THIS.STATE.MSG", this.state.msg)
    this.props.io.emit('turn done', { user: this.props.username, message: this.state.msg })
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
          <AppBar variant="title" position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit" className={classes.flex}
                style={{ fontWeight: 600 }}>
                {this.props.roomName}
              </Typography>
              <Typography variant="title" color="inherit" style={{ fontWeight: 600 }}>
                {this.props.timer}
              </Typography>
            </Toolbar>
          </AppBar>
        </div>

        <div position="static" className={classes.currentTurnBar}>
          <div color="inherit" className={classes.currentTurnText}>
            Current Turn:
          </div>
          <div color="inherit" className={classes.currentTurnText}>
            {this.props.yourTurn ? 'You' : null}
          </div>
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
              disabled={!this.props.yourTurn}
            />
          </FormControl>
          <Button variant="fab" color="primary" aria-label="add" className={classes.button}
            onClick={this.handleClick.bind(this)} disabled={!this.props.yourTurn}>
            <PublishIcon />
          </Button>
        </BottomNavigation>
      </Paper>
    );
  }
}

const RoundLiveChat = connect(mapStateToProps)(ConnectedRoundLiveChat);

export default withStyles(styles)(RoundLiveChat);