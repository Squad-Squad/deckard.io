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
    marginTop: 30,
    backgroundColor: 'rgba(33, 33, 33, 0.5)',
  },
  container: {
    flexGrow: 1,
    position: 'relative',
    height: 250,
  },
  input: {
    fontSize: '16px',
  },
  modal: {
    position: 'absolute',
    boxShadow: theme.shadows[5],
  },
});

class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,

      addFriend: false,
      query: '',

      clickedFriend: '',
    };
  }

  handleClick() {
    this.setState({
      addFriend: true,
    });
  }

  handleOpen(friend) {
    console.log(friend);
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

  addUser(e) {
    console.log(e.key);
    if (e.key === 'Enter') {
      axios.post('/profile/add-friend',
        {
          username: this.props.username,
          friend: this.state.query,
        }
      )
        .then(res => {
          this.props.addFriend(this.state.query);
          this.setState({
            addFriend: false,
            query: '',
          });
        });
    }
  }

  render() {
    const { classes } = this.props;

    const list = () => {
      if (this.props.friends) {
        return this.props.friends.map(friend => {
          return ([
            <ListItem button
              style={{ padding: '12px' }}
              onClick={this.handleOpen.bind(this, friend)}>
              <ListItemText primary={friend} />
              <ListItemIcon>
                <LensIcon style={{
                  color: 'red',
                  marginRight: '0px',
                  opacity: '.6',
                  fontSize: '13px',
                }} />
              </ListItemIcon>
            </ListItem>,
            <Divider />
          ])
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
      <Paper className={classes.paper}>
        <Typography id="new-room-header" style={{ paddingBottom: '8px' }}>
          Friends
        </Typography>
        <Divider />
        <List>
          {list()}
        </List>
        {addFriend()}
      </Paper >,
      <Modal
        style={{ alignItems: 'center', justifyContent: 'center' }}
        open={this.state.open}
        onClose={this.handleClose.bind(this)}
      >
        <div style={{
          top: '20%',
          margin: 'auto',
          width: '700px',
          backgroundColor: 'black',
        }}
          className={classes.modal}>
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