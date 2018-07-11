import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { openAboutDialog } from '../../../../redux/actions';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username,
    avatarURL: state.avatarURL,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    openAboutDialog: () => dispatch(openAboutDialog()),
  };
};

class ConnectedUserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
    this.handleClose = this.handleClose.bind(this);
  }

  handleClick(event) {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  handleLogout() {
    this.props.logout();
    this.props.homeRedirect();
  }

  render() {
    const { anchorEl } = this.state;

    return (
      <div>
        <Button
          aria-owns={anchorEl ? 'simple-menu' : null}
          aria-haspopup="true"
          onClick={this.handleClick.bind(this)}>
          <span style={{ marginRight: '10px' }}>
            {this.props.username}
          </span>
          <img id='navbar-avatar'
            src={this.props.avatarURL} />
        </Button>

        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            horizontal: 'right',
            vertical: 'top',
          }}
          open={Boolean(anchorEl)}
          onClose={this.handleClose.bind(this)}>
          <MenuItem onClick={() => { this.props.homeRedirect(); this.handleClose(); }}>Home</MenuItem>
          <MenuItem onClick={() => { this.props.profileRedirect(); this.handleClose(); }}>Profile</MenuItem>
          <MenuItem onClick={() => { this.props.openAboutDialog(); this.handleClose(); }}>About/Rules</MenuItem>
          <MenuItem onClick={() => { this.handleLogout.call(this); this.handleClose(); }}>Logout</MenuItem>
        </Menu>
      </div>
    );
  }
}

const UserMenu = connect(mapStateToProps, mapDispatchToProps)(ConnectedUserMenu);

export default UserMenu;
