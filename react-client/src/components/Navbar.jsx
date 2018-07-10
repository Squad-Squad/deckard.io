import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import LoginDialog from './AuthUserMenu/LoginDialog.jsx';
import SubscribeDialog from './AuthUserMenu/SubscribeDialog.jsx';
import UserMenu from './AuthUserMenu/UserMenu.jsx';
import logo from '../../dist/assets/unicorn.png';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

const mapStateToProps = state => {
  return {
    loggedIn: state.loggedIn,
    loggedInUsername: state.username,
  };
};

class ConnectedNavbar extends React.Component {
  constructor(props) {
    super(props);

    this.profileRedirect = this.profileRedirect.bind(this);
    this.homeRedirect = this.homeRedirect.bind(this);
  }

  profileRedirect() {
    this.props.history.push(`/userprofile/${this.props.loggedInUsername}`);
  }

  homeRedirect() {
    this.props.history.push(`/`);
  }

  render() {
    const authentication = this.props.loggedIn ?
      (
        <UserMenu
          logout={this.props.logout}
          profileRedirect={this.profileRedirect}
          homeRedirect={this.homeRedirect} />
      )
      : (
        <Toolbar style={{
          padding: '0px'
        }}>
          <LoginDialog
            login={this.props.login}
            error={this.props.error} />
          <SubscribeDialog subscribe={this.props.subscribe} />
        </Toolbar>
      );

    // <a className="bd-tw-button button" data-social-network="Twitter" data-social-action="tweet" data-social-target="http://localhost:4000" target="_blank" href="https://twitter.com/intent/tweet?text=Let's get ready to Food Fight!">
    return (
      <AppBar position="static" color="default"
        style={{ backgroundColor: "rgba(0,0,0,.3)" }}>
        <Toolbar>
          <div style={{ width: "100%" }}>
            <Typography
              color="inherit"
              className={'title'}>
              <span id="typeface-logo">
                <a href="/"
                  style={{ color: "white" }}>
                  deckard.io
                </a>
              </span>
              <span id="image-logo">
                <a href="/">
                  <img src={logo} style={{ height: '3em' }} />
                </a>
              </span>
            </Typography>
          </div>

          {authentication}
        </Toolbar>
      </AppBar>)
  }
}

const Navbar = connect(mapStateToProps)(ConnectedNavbar);

export default withRouter(Navbar);
