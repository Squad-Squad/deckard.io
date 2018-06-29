import React, { Component } from 'react';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class ScoresItem extends Component {
  render() {
    return (
      [<div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingLeft: '15px',
        paddingRight: '15px',
        paddingTop: '15px',
        paddingBottom: '10px',
        fontSize: '20px',
      }}>
        <div>
          {this.props.user}
        </div>
        <div>
          {this.props.score}
        </div>
      </div>,
      <Divider />]
    );
  }
}

export default connect(
  mapStateToProps,
)(ScoresItem);