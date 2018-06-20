import React from 'react';
import LoginDialog from './AuthUserMenu/LoginDialog.jsx';
import SubscribeDialog from './AuthUserMenu/SubscribeDialog.jsx';
import UserMenu from './AuthUserMenu/UserMenu.jsx';
import { Link } from 'react-router-dom';

class Navbar extends React.Component {
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

    let authentication = this.props.loggedIn ? (
      [<UserMenu
        logout={this.props.logout}
        username={this.props.username} />,
      <div className="navbar-item">Wins: {this.props.wins}</div>,
      <img src={badge}></img>]
    ) : (
        [<div className="control" key="1">
          <LoginDialog
            login={this.props.login}
            error={this.props.error} />
        </div>,
        <div className="control" key="2">
          <SubscribeDialog
            subscribe={this.props.subscribe}
            subscribeError={this.props.subscribeError} />
        </div>]
      );

    return (
      <nav className="navbar is-transparent">
        <div className="navbar-brand">
          <a className='title' href='/'><h1 id="logo">FoodFighter!</h1></a>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className="field is-grouped">
              <p className="control">
                <a className="bd-tw-button button" data-social-network="Twitter" data-social-action="tweet" data-social-target="http://localhost:4000" target="_blank" href="https://twitter.com/intent/tweet?text=Let's get ready to Food Fight!">
                  <span className="icon">
                    <i className="fab fa-twitter"></i>
                  </span>
                  <span>
                    Tweet
                  </span>
                </a>
              </p>
              {authentication}
            </div>
          </div>
        </div>
      </nav >
    );
  }
}

export default Navbar;
