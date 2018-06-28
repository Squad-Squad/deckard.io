import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import VotePanelItem from './VotePanelItem.jsx';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

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

  submitVotes() {
    const submitObj = {
      user: this.props.loggedInUser,
      votes: this.state.membersVoteMap
    };
  }

  render() {
    const { classes } = this.props;
    console.log('YOOOOOO', this.state.membersVoteMap);
    return (
      <Paper style={{
        backgroundColor: 'rgba(255,255,255,.1)'
      }}>
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
          <VotePanelItem key={i} user={user} setVote={this.setVote.bind(this)} />
        )}

        {/* BOTTOM BAR */}
        <BottomNavigation style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Button variant="contained" color="secondary" aria-label="add" className={classes.button}
            onClick={this.submitVotes.bind(this)}>
            Submit
          </Button>
        </BottomNavigation>
      </Paper>
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VotePanel));