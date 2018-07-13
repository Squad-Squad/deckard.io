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
    highest: 0,
  }

  componentDidMount() {
    this.setState({
      highest: this.getHighestScore(),
    })
  }

  getHighestScore() {
    let highest = 0;
    for (let user in this.props.scores) {
      (this.props.scores[user] > highest) ?
        highest = this.props.scores[user] :
        null;
    }

    console.log('HIGHEST', highest);
    return highest;
  }

  // memberMap: {mitsuku@mitsuku.com: "Robocop", adonesky@gmail.com: "Data", dance1@gmail.com: "Dolores"}

  // scores: {adonesky@gmail.com: 10, dance1@gmail.com: 10}

  render() {
    return (
      <Paper>
        {/* TOP BAR */}
        <div style={{ flex: 1 }}>
          <AppBar position="static" color="default"
            style={{ backgroundColor: 'rgba(30, 30, 30, .5)' }}>
            <Toolbar>

              {/* BOT REVEAL */}
              <Typography variant="title" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingLeft: '15px',
                paddingRight: '15px',
                paddingTop: '15px',
                paddingBottom: '10px',
                fontSize: '20px',
                width: '100%',
              }}>
                <div style={{ fontSize: '20px' }}>
                  The Bot Is:
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    margin: '15px 0px 10px 0px'
                  }}>
                  <img
                    src={`../assets/aliasImages/${this.props.memberMap['mitsuku@mitsuku.com']}.jpg`}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '50%',
                      height: '40px',
                      width: '40px',
                      marginRight: '10px',
                    }} />
                  <strong>{this.props.memberMap['mitsuku@mitsuku.com']}</strong>
                </div>
                {/* <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: '10px'
                }}>
                  <span>Users</span>
                  <span>Scores</span>
                </div> */}
              </Typography>
              <Divider />
            </Toolbar>
          </AppBar>
        </div>


        {/* USER RESULTS */}
        {Object.keys(this.props.scores).map((user, i) =>
          <ScoresItem
            key={i}
            user={user}
            score={this.props.scores[user]}
            scoreWidth={(this.props.scores[user]) ?
              (this.props.scores[user] / this.state.highest) * 100 : 5
            }
            alias={this.props.memberMap[user]} />
        )}
      </Paper>
    );
  }
}

export default connect(
  mapStateToProps,
)(Scores);