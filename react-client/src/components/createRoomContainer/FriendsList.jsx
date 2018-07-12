import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import LensIcon from '@material-ui/icons/Lens';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import axios from 'axios';
import Modal from '@material-ui/core/Modal';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import OtherProfileContainer from '../profileAndStats/OtherProfileContainer.jsx';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { addFriend } from '../../../../redux/actions';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';

function mapStateToProps(state) {
  return {
    username: state.username,
    friends: state.friends,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addFriend: (friend) => dispatch(addFriend(friend)),
  };
}

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: '12px',
    marginBottom: '30px',
  },
  container: {
    flexGrow: 1,
    position: 'relative',
    height: 250,
  },
  input: {
    fontSize: '16px',
  },
});

class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      snackbarOpen: false,

      addFriend: false,
      query: '',

      userAvatarMap: [],

      clickedFriend: '',

      width: 0,
      height: 0,

      expanded: false,

      addFriendError: '',
    };

    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.mapAvatars();
  }

  updateWindowDimensions() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    }, () => {
      if (this.state.width > 700) {
        this.setState({
          expanded: true,
        })
      }
    })
  }

  scrollToBottom() {
    console.log('SCROLLING');
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  handleClick() {
    this.setState({
      addFriend: true,
    });
  }

  handleOpen(friend) {
    this.setState({
      clickedFriend: friend
    }, () => {
      this.setState({
        open: true,
      });
    });
  }

  handleClose() {
    this.setState({ open: false });
  }

  updateQuery(e) {
    this.setState({
      query: e.target.value,
      addFriendError: '',
    });
  }

  showFriends() {
    console.log(this.state.expanded);
    this.setState(prevState => ({
      expanded: !prevState.expanded,
    }))
  }

  handleSnackbarClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ snackbarOpen: false });
  };

  mapAvatars() {
    // Add avatars to users who have set them
    if (this.props.friends) {
      Promise.all(this.props.friends.map(friend => {
        return axios.post('/api/userInfo', { user: friend });
      }))
        .then(res => {
          const avatars = res.map(data => data.data.avatar);
          const map = this.props.friends.map((friend, i) => {
            return [friend, avatars[i]];
          });
          this.setState({ userAvatarMap: map });
        });
    }
  }

  async addUser(e) {
    if (e.key === 'Enter') {
      const error = await axios.post('/profile/add-friend',
        {
          username: this.props.username,
          friend: this.state.query,
        }
      );
      console.log("ERROR", error);
      if (!error.data.length) {
        this.props.addFriend(this.state.query);
        this.setState({
          addFriend: false,
          query: '',
          snackbarOpen: true,
        });
        this.scrollToBottom();
      } else {
        this.setState({
          addFriendError: error.data,
        })
      }
      this.mapAvatars();
    }
  }


  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    const { classes } = this.props;

    console.log('FRIENDS', this.props.friends);

    const expandList = () => {
      if (this.state.expanded) {
        return (
          <div>
            <List
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0)',
                maxHeight: '280px',
                overflow: 'auto'
              }}>
              {list()}
              <div ref={(el) => { this.messagesEnd = el; }}>
              </div>
            </List>
            {addFriend()}
          </div>
        )
      } else {
        return null;
      }
    }

    const list = () => {
      if (this.state.userAvatarMap) {
        return this.state.userAvatarMap.map(friendAvatar => {
          if (!this.props.onlineUsers.includes(friendAvatar[0])) {
            return ([
              <ListItem button key={1}
                style={{ padding: '12px', opacity: '.4' }}
                onClick={this.handleOpen.bind(this, friendAvatar[0])}>
                {(() => (friendAvatar[1] !== './assets/roboheadwhite.png') ?
                  <img
                    src={friendAvatar[1]}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '50%',
                      height: '32px',
                      width: '32px',
                      marginRight: '-5px',
                    }} /> : null)()}
                <ListItemText primary={friendAvatar[0]} />
              </ListItem>,
              <Divider key={2} />
            ])
          } else {
            return ([
              <ListItem button key={1}
                style={{ padding: '12px' }}
                onClick={this.handleOpen.bind(this, friendAvatar[0])}>
                {
                  (friendAvatar[1] !== './assets/roboheadwhite.png') ?
                    <img
                      src={friendAvatar[1]}
                      style={{
                        objectFit: 'cover',
                        borderRadius: '50%',
                        height: '32px',
                        width: '32px',
                        marginRight: '-5px',
                      }} /> : null
                }
                <ListItemText primary={friendAvatar[0]} />
              </ListItem>,
              <Divider key={2} />
            ])
          }
        })
      } else {
        return null;
      }
    };

    const addFriend = () => {
      if (this.state.addFriendError) {
        return (
          <FormControl style={{ width: '100%' }} error>
            <Input
              style={{ fontSize: '16px' }}
              value={this.state.query}
              onChange={this.updateQuery.bind(this)}
              placeholder="Add Friend"
              onKeyUp={this.addUser.bind(this)}
            />
            <FormHelperText id="name-error-text">
              {this.state.addFriendError}
            </FormHelperText>
          </FormControl>
        )
      } else if (this.state.addFriend) {
        return (
          <FormControl style={{ width: '100%' }} >
            <Input
              autoFocus={true}
              style={{ fontSize: '16px' }}
              value={this.state.query}
              onChange={this.updateQuery.bind(this)}
              placeholder="Add Friend"
              onKeyUp={this.addUser.bind(this)}
            />
          </FormControl>
        )
      } else {
        return (
          <div
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              paddingTop: '0px',
            }}
            onClick={this.handleClick.bind(this)}>
            Add Friend
          </div>
        )
      }
    }

    return ([
      <Paper
        className={classes.paper}
        key={1}>
        <div
          onClick={this.showFriends.bind(this)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Typography id="new-room-header" style={{ paddingBottom: '8px', fontSize: '24px' }}>
            Friends
          </Typography>
          <span style={{ marginLeft: '5px' }}>
            {
              (this.state.width < 700) ?
                (this.state.expanded) ? <KeyboardArrowUp />
                  : <KeyboardArrowDown />
                : null
            }
          </span>
        </div>
        <Divider />
        {expandList()}
      </Paper >,
      <Modal key={2}
        disableAutoFocus={true}
        style={{ alignItems: 'center', justifyContent: 'center' }}
        open={this.state.open}
        onClose={this.handleClose.bind(this)}
      >
        <div className="profile-modal" style={{ backgroundColor: 'rgba(0,0,0,.9)' }}>
          <OtherProfileContainer friend={this.state.clickedFriend} />
        </div>
      </Modal>
      // <Snackbar
      //   anchorOrigin={{
      //     vertical: 'bottom',
      //     horizontal: 'left',
      //   }}
      //   open={this.state.snackbarOpen}
      //   autoHideDuration={2000}
      //   onClose={this.handleSnackbarClose.bind(this)}
      //   ContentProps={{
      //     'aria-describedby': 'message-id',
      //   }}
      //   message={<span id="message-id">Friend added.</span>}
      //   action={[
      //     <IconButton
      //       key="close"
      //       aria-label="Close"
      //       color="inherit"
      //       className={classes.close}
      //       onClick={this.handleSnackbarClose.bind(this)}
      //     >
      //       <CloseIcon />
      //     </IconButton>,
      //   ]}
      // />
    ]);
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(FriendsList));