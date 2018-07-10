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
import Input from '@material-ui/core/Input';
import axios from 'axios';
import Modal from '@material-ui/core/Modal';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import OtherProfileContainer from '../profileAndStats/OtherProfileContainer.jsx';
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

      addFriend: false,
      query: '',

      userAvatarMap: [],

      clickedFriend: '',

      width: 0,
      height: 0,

      expanded: false,
    };

    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);

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
    });
  }

  showFriends() {
    console.log(this.state.expanded);
    this.setState(prevState => ({
      expanded: !prevState.expanded,
    }))
  }

  async addUser(e) {
    if (e.key === 'Enter') {
      await axios.post('/profile/add-friend',
        {
          username: this.props.username,
          friend: this.state.query,
        }
      );
      this.props.addFriend(this.state.query);
      this.setState({
        addFriend: false,
        query: '',
      });
    }
  }

  render() {
    const { classes } = this.props;

    const expandList = () => {
      if (this.state.expanded) {
        return (
          <div>
            <List
              style={{
                backgroundColor: 'rgba(0, 0, 0, .5)',
                maxHeight: '280px',
                overflow: 'auto'
              }}>
              {list()}
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
      if (this.state.addFriend) {
        return (
          <FormControl style={{ width: '100%' }} >
            <Input
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
              paddingTop: '15px',
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
        style={{ alignItems: 'center', justifyContent: 'center' }}
        open={this.state.open}
        onClose={this.handleClose.bind(this)}
      >
        <div className="profile-modal" style={{ backgroundColor: 'rgba(0,0,0,.9)' }}>
          <OtherProfileContainer friend={this.state.clickedFriend} />
        </div>
      </Modal>
    ]);
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(FriendsList));