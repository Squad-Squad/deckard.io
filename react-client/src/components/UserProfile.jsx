import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import Button from '@material-ui/core/Button';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import axios from 'axios'

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

class ConnectedUserProfile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      membersVoteMap: {},
      submitted: false,
      lifetimeScore: null
    };
  }

   componentDidMount() {
    axios.post('/api/userInfo', {user: this.props.loggedInUser})
    .then((response)=>{
      console.log("response on userProfile", response.data)
      this.setState({
        lifetimeScore: response.data
      }, ()=>{console.log("new lifetimeScore state", this.state.lifetimeScore)})
    })
  }
   


  render() {
    const { classes } = this.props;

    return (
      <div>
        <Paper style={{
            backgroundColor: 'rgba(255,255,255,.1)'
          }}>
            {/* TOP BAR */}
            <div className={classes.root}>
              <AppBar position="static" color="default">
                <Toolbar>
                  <Typography variant="title" color="inherit" className={classes.flex}>
                    Your Player Profile
                  </Typography>
                </Toolbar>
              </AppBar>
              <Typography variant="title" color="inherit" className={classes.flex}>
                    Lifetime Score
                  </Typography>
                  <Typography variant="title" color="inherit" className={classes.flex}>
                    {this.state.lifetimeScore}
                  </Typography>
            </div>

            {/* BOTTOM BAR */}
            <BottomNavigation style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <Button variant="contained" color="secondary" aria-label="add" className={classes.button}>
                Submit
              </Button>
            </BottomNavigation>
          </Paper>
      </div>
    );
  }
}

const UserProfile = connect(mapStateToProps)(ConnectedUserProfile)

export default withStyles(styles)(withRouter(UserProfile));