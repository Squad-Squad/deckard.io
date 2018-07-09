import React, { Component } from 'react';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class UserStats extends Component {
  render() {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap'
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
        <div className="stats-tile" style={{ marginBottom: '30px' }}>
          LIFETIME SCORE
          <div className="stats-number" style={{ marginBottom: '30px' }}>
            {this.props.lifetimeScore}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(UserStats);