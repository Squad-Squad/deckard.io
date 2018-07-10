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
        <Divider light />
        {
          (this.state.waiting) ? null :
            <div
              className="animated fadeIn"
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

        }
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Splash);