import React, { Component } from 'react';
import UnicornSVG from '../../dist/assets/unicorn2.svg';
import LoginDialog from './AuthUserMenu/LoginDialog.jsx';
import SubscribeDialog from './AuthUserMenu/SubscribeDialog.jsx';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class Splash extends Component {
  render() {
    return (
      <div
        className="animated fadeIn"
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
        <div id="splash-unicorn">
          <img
            src={UnicornSVG} />
        </div>
        <Divider light />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
          <LoginDialog
            login={this.props.login}
            error={this.props.error} />
          <SubscribeDialog subscribe={this.props.subscribe} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Splash);