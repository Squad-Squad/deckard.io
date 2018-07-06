import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Email from '@material-ui/icons/Email';
import Edit from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import placeholder from './../../../dist/assets/profile-placeholder.jpg';
import { connect } from 'react-redux';
import { login } from '../../../../redux/actions';
import axios from 'axios';

function mapStateToProps(state) {
  return {
    username: state.username,
    email: state.email,
    isGoogleAccount: state.isGoogleAccount,
    avatarURL: state.avatarURL,
    description: state.description,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login: (username, email, isGoogleAccount, avatarURL, description) => {
      return dispatch(login(username, email, isGoogleAccount, avatarURL, description));
    },
  };
}

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  handleClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };


  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    const currImage = () => {
      if (this.props.avatarURL === './assets/roboheadwhite.png') {
        return (
          <img
            src={"https://www.bsn.eu/wp-content/uploads/2016/12/user-icon-image-placeholder-300-grey.jpg"}
            alt="Avatar" className="profile-photo-upload-image" />
        )
      } else {
        return (
          <img
            src={this.props.avatarURL}
            alt="Avatar" className="profile-photo-upload-image" />
        )
      }
    };

    return (
      <div style={{ display: 'flex', alignContent: 'flex-start' }}>
        <div className="profile-photo-upload-container">
          {currImage()}
        </div>
        <div
          className="user-profile-edit-area">
          <div>
            <span style={{ display: 'flex', alignContent: 'center' }}>
              <AccountCircle style={{ marginRight: '10px' }} />
              {this.props.username}
            </span>
          </div>
          <div>
            <span style={{ display: 'flex', alignContent: 'center' }}>
              <Email style={{ marginRight: '10px' }} />
              {this.props.email}
            </span >
          </div>
          <Divider style={{ margin: '0px 0px 15px 0px' }} />
          <div>
            <div style={{ display: 'flex', alignContent: 'center', marginBottom: '10px' }}>
              {this.props.description}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfile);