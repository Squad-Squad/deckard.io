import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import VotePanelItem from './VotePanelItem.jsx';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {
    usersInRoom: state.currRoomUsers,
    loggedInUser: state.username,
  };
}

const styles = theme => ({
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

class VotePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      membersVoteMap: {},
    };
  }

  componentDidMount() {
    this.setState({
      membersVoteMap: Object.keys(this.props.memberMap).reduce((obj, member) => {
        obj[member] = '';
        return obj;
      }, {}),
    });
  }

  setVote(alias, humanOrAI) {
    for (let email in this.props.memberMap) {
      if (this.props.memberMap[email] === alias) {
        const newState = Object.assign(this.state.membersVoteMap, {
          [email]: humanOrAI,
        });
        this.setState({
          membersVoteMap: newState
        });
      }
    }
  }

  render() {
    const { classes } = this.props;
    console.log('YOOOOOO', this.state.membersVoteMap);
    return (
      <Paper>
        {/* TOP BAR */}
        <div className={classes.root}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit" className={classes.flex}>
                Voting
              </Typography>
            </Toolbar>
          </AppBar>
        </div>

        {this.props.members.map((user, i) =>
          <VotePanelItem key={i} user={user} />
        )}

        {/* BOTTOM BAR */}
        <BottomNavigation>
          <Button variant="fab" color="primary" aria-label="add" className={classes.button}
            onClick={this.submitVotes.bind(this)}>
            <PublishIcon />
          </Button>
        </BottomNavigation>
      </Paper>
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VotePanel));