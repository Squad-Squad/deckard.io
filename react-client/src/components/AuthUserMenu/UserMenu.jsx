import React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username
  };
};

class ConnectedUserMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="navbar-item has-dropdown is-hoverable">
        <a className="navbar-link" href="/documentation/overview/start/">
          {this.props.username}
        </a>
        <div className="navbar-dropdown is-boxed">
          <a className="navbar-item" href="/">
            Friends
          </a>
          <a className="navbar-item" href="/">
            Favorites
          </a>
          <hr className="navbar-divider" />
          <a className="navbar-item is-active" onClick={this.props.logout}>
            Logout
          </a>
        </div>
      </div>
    );
  }
}

const UserMenu = connect(mapStateToProps)(ConnectedUserMenu);

export default UserMenu;
