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

class ProfileContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,

      gamesPlayed: 0,
      gamesWon: 0,
      lifetimeScore: 0,

      profileImageURL: '',
    };
  }

  async componentDidMount() {
    // Get user stats
    const responses = await axios.post('/api/userInfo', { user: this.props.loggedInUser })
    this.setState({
      gamesPlayed: response.data.games_played,
      gamesWon: response.data.games_won,
      lifetimeScore: response.data.lifetime_score,
    }, () => (console.log('USER INFO', this.state)));
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
                  fullWidth centered>
                  <Tab label="Profile" />
                  <Tab label="Stats" />
                </Tabs>
              </AppBar>
              <SwipeableViews
                index={this.state.value}
                onChangeIndex={this.handleChangeIndex.bind(this)}>
                <UserProfile />
                <UserStats
                  gamesPlayed={this.state.gamesPlayed}
                  gamesWon={this.state.gamesWon}
                  lifetimeScore={this.state.lifetimeScore} />
              </SwipeableViews>
            </Paper>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps
)(withStyles(styles)(ProfileContainer));
