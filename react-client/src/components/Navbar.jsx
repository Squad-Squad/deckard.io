import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import LoginDialog from './AuthUserMenu/LoginDialog.jsx';
import SubscribeDialog from './AuthUserMenu/SubscribeDialog.jsx';
import UserMenu from './AuthUserMenu/UserMenu.jsx';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    loggedIn: state.loggedIn,
  };
};

class ConnectedNavbar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let badge = '';
    if (this.props.wins >= 20) {
      badge = '/assets/king.png'
    } else if (this.props.wins >= 15) {
      badge = '/assets/gold.png'
    } else if (this.props.wins >= 10) {
      badge = '/assets/silver.png'
    } else if (this.props.wins >= 5) {
      badge = '/assets/bronze.png'
    }

    const authentication = this.props.loggedIn ?
      (
        <UserMenu
          logout={this.props.logout}
          username={this.props.username} />
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
        style={{ backgroundColor: "rgba(33,33,33,.3)" }}>
        <Toolbar>
          <div style={{ width: "100%" }}>
            <Typography
              variant="title"
              color="inherit"
              className={'title'}>
              <div id="logo">
                <a href="/"
                  style={{ color: "white" }}>
                  deckard.io
              </a>
              </div>
            </Typography>
          </div>

          {authentication}
        </Toolbar>
      </AppBar>)
  }
}

const Navbar = connect(mapStateToProps)(ConnectedNavbar);

export default Navbar;
