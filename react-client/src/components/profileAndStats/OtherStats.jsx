import React, { Component } from 'react';
import axios from 'axios'
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class UserStats extends Component {

  render() {
    return ([
      <div style={{
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <div className="stats-tile">
          GAMES PLAYED
          <div className="stats-number">
            {this.props.gamesPlayed}
          </div>
        </div>
        <div className="stats-tile">
          GAMES WON
          <div className="stats-number">
            {this.props.gamesWon}
          </div>
        </div>
        <div className="stats-tile">
          LIFETIME SCORE
          <div className="stats-number">
            {this.props.lifetimeScore}
          </div>
        </div>
      </div>
    ]);
  }
}

export default connect(
  mapStateToProps,
)(UserStats);