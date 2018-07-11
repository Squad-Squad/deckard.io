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
  state = {
    waiting: true,
    lineWait: true,
  }

  componentDidMount() {
    setTimeout(() => this.setState({
      waiting: false,
    }), 1000);
    setTimeout(() => this.setState({
      lineWait: false,
    }), 1100);
  }

  render() {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
        <div
          className="animated fadeIn splash">
          <img
            src={UnicornSVG} />
        </div>
        {
          (this.state.waiting) ?
            <div className="splash--plus"
              style={{
                visibility: 'hidden'
              }}>
              <hr
                className={'trans--grow ' + (this.state.lineWait ? null : 'grow')}
                style={{
                  backgroundColor: 'white',
                  opacity: 1,
                  marginTop: '20px',
                  marginBottom: '0px',
                  height: '2px',
                }} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <LoginDialog
                  login={this.props.login}
                  error={this.props.error} />
                <SubscribeDialog subscribe={this.props.subscribe} />
              </div>
            </div> :
            <div
              className="animated fadeIn splash--plus">
              <hr
                className={'trans--grow ' + (this.state.lineWait ? null : 'grow')}
                style={{
                  backgroundColor: 'white',
                  opacity: 1,
                  marginTop: '20px',
                  marginBottom: '0px',
                  height: '2px',
                }} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <LoginDialog
                  login={this.props.login}
                  error={this.props.error} />
                <SubscribeDialog subscribe={this.props.subscribe} />
              </div>
            </div>
        }
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Splash);