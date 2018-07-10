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
  }

  componentDidMount() {
    setTimeout(() => this.setState({
      waiting: false,
    }), 1000);
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
        <div id="splash-unicorn"
          className="animated fadeIn">
          <img
            src={UnicornSVG} />
        </div>
        {
          (this.state.waiting) ?
            <div
              style={{
                visibility: 'hidden'
              }}>
              <Divider style={{
                width: '30%',
                backgroundColor: 'white',
                opacity: 1,
                marginTop: '20px',
                height: '4px',
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
              className="animated fadeIn"
              style={{ width: '30%' }}>
              <Divider style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: 1,
                marginTop: '20px',
                height: '4px',
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