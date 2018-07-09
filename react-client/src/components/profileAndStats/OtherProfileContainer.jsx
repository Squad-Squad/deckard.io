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
import UserStats from './UserStats.jsx';
import OtherProfile from './OtherProfile.jsx';
import OtherStats from './OtherStats.jsx';
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

class OtherProfileContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,

      username: '',
      email: '',
      description: '',
      avatarURL: '',
      gamesPlayed: 0,
      gamesWon: 0,
      lifetimeScore: 0,

      profileImageURL: '',
    };
  }

  async componentDidMount() {
    // Get user stats
    const response = await axios.post('/api/userInfo', { user: this.props.friend })
    this.setState({
      username: response.data.username,
      email: response.data.email,
      avatarURL: response.data.avatar,
      description: response.data.description,
      gamesPlayed: response.data.games_played,
      gamesWon: response.data.games_won,
      lifetimeScore: response.data.lifetime_score,
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
        <Paper style={{
          backgroundColor: 'rgba(20,20,20,.7)'
        }}>
          <AppBar position="static" color="default">
            <Tabs
              value={this.state.value}
              onChange={this.handleChange.bind(this)}
              indicatorColor="primary"
              textColor="white"
              fullWidth centered>
              <Tab label="Profile" />
              <Tab label="Stats" />
            </Tabs>
          </AppBar>
          <div className="modal-profile-view">
            <SwipeableViews
              index={this.state.value}
              onChangeIndex={this.handleChangeIndex.bind(this)}>
              <OtherProfile
                username={this.state.username}
                email={this.state.email}
                description={this.state.description}
                avatarURL={this.state.avatarURL} />
              <OtherStats
                gamesPlayed={this.state.gamesPlayed}
                gamesWon={this.state.gamesWon}
                lifetimeScore={this.state.lifetimeScore} />
            </SwipeableViews>
          </div>
        </Paper>
      </div>
    );
  }
}

export default connect(
  mapStateToProps
)(withStyles(styles)(OtherProfileContainer));
