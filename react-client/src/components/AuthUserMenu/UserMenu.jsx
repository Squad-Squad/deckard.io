import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    username: state.username
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
          {this.props.username}
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
          <MenuItem onClick={this.props.logout}>Logout</MenuItem>
          {/* <MenuItem onClick={this.props.profile}>Your Profile</MenuItem> */}
        </Menu>
      </div>
    );
  }
}

const UserMenu = connect(mapStateToProps)(ConnectedUserMenu);

export default UserMenu;
