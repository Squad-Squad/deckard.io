import React, { Component } from 'react';
import UnicornSVG from '../../dist/assets/unicorn2.svg';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class Splash extends Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <div
          style={{
            width: '50%'
          }}>
          <img
            src={UnicornSVG} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Splash);