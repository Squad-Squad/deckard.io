import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ScoresItem from './ScoresItem.jsx';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class Scores extends Component {
  state = {
    winner: '',
    botAlias: '',
  }

  componentDidMount() {
    console.log("MEMBERMAP in SCORES", this.props.memberMap, "and scoresObj", this.props.scores)
    // this.props.scores.map((user)=>{
    //   user.alias = this.props.memberMap[]
    // })

  }

  getWinner() {
    let winScore = 0, winner = '';
    for (let user in this.props.scores) {
      if (this.props.scores[user] > winScore) {
        winScore = this.props.scores[user];
        winner = user;
      }
    }

    this.setState({
      winner: this.props.memberMap[winner],
    })
  }

  getBotAlias() {

  }

  // memberMap: {mitsuku@mitsuku.com: "Robocop", adonesky@gmail.com: "Data", dance1@gmail.com: "Dolores"}

  // scores: {adonesky@gmail.com: 10, dance1@gmail.com: 10}

  render() {
    return (
      <Paper style={{
        backgroundColor: 'rgba(255,255,255,.1)'
      }}>
        {/* TOP BAR */}
        <div style={{ flex: 1 }}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography variant="title" color="inherit">
                Scores
              </Typography>
            </Toolbar>
          </AppBar>
        </div>

        {/* BOT REVEAL */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: '15px',
          paddingRight: '15px',
          paddingTop: '15px',
          paddingBottom: '10px',
          fontSize: '20px',
        }}>
          DIS DA BOT
        </div>
        <Divider />

        {/* USER RESULTS */}
        {Object.keys(this.props.scores).map((user, i) =>
          <ScoresItem
            key={i}
            user={user}
            score={this.props.scores[user]}
            winner={this.getWinner()}
            alias={this.props.memberMap[user]} />
        )}
      </Paper>
    );
  }
}

export default connect(
  mapStateToProps,
)(Scores);