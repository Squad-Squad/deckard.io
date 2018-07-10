import React, { Component } from 'react';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class ScoresItem extends Component {
  render() {
    const scoreCard = () => {
      if (this.props.winner === this.props.alias) {
        return (
          <div key={this.props.key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingLeft: '15px',
            paddingRight: '15px',
            paddingTop: '15px',
            paddingBottom: '10px',
            fontSize: '20px',
            boxShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #f2f2f2',
            borderRadius: '5px',
            border: '1px solid white',
          }}>
            <div>
              {this.props.user}{' '}(<strong>{this.props.alias}</strong>)
            </div>
            <div>
              {this.props.score}
            </div>
          </div>
        )
      } else {
        return (
          <div key={this.props.key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingLeft: '15px',
            paddingRight: '15px',
            paddingTop: '15px',
            paddingBottom: '10px',
            fontSize: '20px',
          }}>
            <div>
              {this.props.user}{' '}(<strong>{this.props.alias}</strong>)
            </div>
            <div>
              {this.props.score}
            </div>
          </div>
        )
      }
    }

    return ([
      <div>
        {scoreCard()}
      </div>,
      <Divider />
    ]);
  }
}

export default connect(
  mapStateToProps,
)(ScoresItem);