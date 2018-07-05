import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username,
    avatarURL: state.avatarURL,
  };
};

class ConnectedUserMenu extends React.Component {
  state = {
    anchorEl: null,
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };


  render() {
    const { anchorEl } = this.state;

    return (
      <div>
        <Button
          aria-owns={anchorEl ? 'simple-menu' : null}
          aria-haspopup="true"
          onClick={this.handleClick}
        >
          <span style={{ marginRight: '20px' }}>
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
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.props.profile}>Profile</MenuItem>
          <MenuItem onClick={this.props.logout}>Logout</MenuItem>
        </Menu>
      </div>
    );
  }
}

const UserMenu = connect(mapStateToProps)(ConnectedUserMenu);

export default UserMenu;
