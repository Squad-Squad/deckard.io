import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import VotePanelItem from './VotePanelItem.jsx';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import Button from '@material-ui/core/Button';
import AwaitingResults from './AwaitingResults.jsx';
import { withRouter } from 'react-router-dom';
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
    width: '100%',
    height: '42px',
    margin: '0px',
    borderRadius: '0px',
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
      submitted: false,
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
    // this.props.history.push(`/rooms/${this.props.roomId}/awaiting-results`);
    // axios.post('/api/saveVotes', submitObj)
    this.setState({
      submitted: true,
    });

    this.props.io.emit('vote', submitObj)

  }

  render() {
    const { classes } = this.props;

    const formOrLoader = () => {
      if (this.state.submitted) {
        return (<AwaitingResults />);
      } else {
        return (
          <Paper>
            {/* TOP BAR */}
            <div className={classes.root}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography variant="title" color="inherit" className={classes.flex}
                    style={{ fontWeight: 600 }}>
                    Voting
                  </Typography>
                </Toolbar>
              </AppBar>
            </div>

            {this.props.members.map((user, i) => {
              if (user !== this.props.memberMap[this.props.loggedInUser]) {
                return <VotePanelItem thisKey={i} user={user} setVote={this.setVote.bind(this)} />
              }
            }
            )}

            {/* BOTTOM BAR */}
            <Button variant="contained" color="secondary" aria-label="add"
              className={classes.button}
              onClick={this.submitVotes.bind(this)}>
              Submit
            </Button>
          </Paper>
        )
      }
    }

    return (
      <div>
        {formOrLoader()}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(withRouter(VotePanel)));