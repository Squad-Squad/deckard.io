import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import SwipeableViews from 'react-swipeable-views';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import UserProfile from './UserProfile.jsx';
import axios from 'axios';

function mapStateToProps(state) {
  return {
    usersInRoom: state.currRoomUsers,
    loggedInUser: state.username,
  };
}

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  input: {
    display: 'none',
  },
  root: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
});

class ConnectedUserProfileContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,

      username: '',
      email: '',
      avatarURL: '',
      lifetimeScore: null,
      profileImageURL: '',
    };
  }

  componentDidMount() {
    axios.post('/api/userInfo', { user: this.props.loggedInUser })
      .then((response) => {
        console.log("response on userProfile", response.data);
        this.setState({
          username: response.data.username,
          email: response.data.email,
          avatarURL: response.data.avatar,
          lifetimeScore: response.data.lifetime_score
        }, () => (console.log('USER INFO', this.state)));
      });
  }

  handleChange(event, value) {
    this.setState({ value });
  }

  handleChangeIndex(index) {
    console.log('CHANGING');
    this.setState({ value: index });
  }

  render() {
    const { classes, theme } = this.props;

    return (
      <div>
        <div className="columns">
          <div className="column is-1 hide-if-small">
          </div>
          <div className="column is-10">
            <Paper style={{
              backgroundColor: 'rgba(255,255,255,.1)'
            }}>
              <AppBar position="static" color="default">
                <Tabs
                  value={this.state.value}
                  onChange={this.handleChange.bind(this)}
                  indicatorColor="primary"
                  textColor="white"
                  fullWidth
                >
                  <Tab label="Profile" />
                  <Tab label="Stats" />
                </Tabs>
              </AppBar>
              <SwipeableViews
                index={this.state.value}
                onChangeIndex={this.handleChangeIndex.bind(this)}
              >
                <UserProfile
                  username={this.state.username}
                  email={this.state.email} />
                <Typography component="div" style={{ padding: 8 * 3 }}>
                  STATS
                </Typography>
              </SwipeableViews>
            </Paper>
          </div>
        </div>
      </div>
    );
  }
}

const UserProfileContainer = connect(mapStateToProps)(ConnectedUserProfileContainer)

export default withStyles(styles)(UserProfileContainer);

