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
import { login, removeAllUsersFromNewRoom } from '../../../../redux/actions';
import axios from 'axios';

function mapStateToProps(state) {
  return {
    username: state.username,
    email: state.email,
    isGoogleAccount: state.isGoogleAccount,
    avatarURL: state.avatarURL,
    description: state.description,
    friends: state.friends,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login: (username, email, isGoogleAccount, avatarURL, description, friends) => {
      return dispatch(login(username, email, isGoogleAccount, avatarURL, description, friends));
    },
    removeAllUsersFromNewRoom: () => dispatch(removeAllUsersFromNewRoom()),
  };
}

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,

      editUsername: false,
      newUsername: '',

      editEmail: false,
      newEmail: '',

      editDescription: false,
      newDescription: '',

      file: null,
      imagePreviewUrl: null,
    };
  }

  handleClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };

  handlePhotoChange(e) {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      this.setState({
        file: file,
        imagePreviewUrl: reader.result
      });
    };

    reader.readAsDataURL(file);
  }

  editUsername() {
    this.setState({
      editUsername: true,
    });
  }

  enterUsername(e) {
    this.setState({
      newUsername: e.target.value,
    });
  }

  editEmail() {
    this.setState({
      editEmail: true,
    });
  }

  enterEmail(e) {
    this.setState({
      newEmail: e.target.value,
    });
  }

  editDescription() {
    this.setState({
      editDescription: true,
    });
  }

  enterDescription(e) {
    this.setState({
      newDescription: e.target.value,
    });
  }

  async updateProfile() {
    const login = this.props.login;

    const data = new FormData();
    data.append('avatar', this.state.file);
    data.append('username', this.props.username);
    data.append('newusername', this.state.newUsername);
    data.append('newemail', this.state.newEmail);
    data.append('newdescription', this.state.newDescription);

    const res = await axios({
      method: 'post',
      url: '/profile/update-profile',
      data,
      config: { headers: { 'Content-Type': 'multipart/form-data' } }
    });

    console.log("RES", res);
    const updateUsername = this.state.newUsername || this.props.username,
      updateEmail = this.state.newEmail || this.props.email,
      updateAvatarURL = res.data || this.props.avatarURL,
      updateDescription = this.state.newDescription || this.props.description;
    login.call(this,
      updateUsername,
      updateEmail,
      this.props.isGoogleAccount,
      updateAvatarURL,
      updateDescription,
      this.props.friends);
    this.props.removeAllUsersFromNewRoom();
    this.setState({
      open: true,

      newUsername: '',
      editUsername: false,

      newEmail: '',
      editEmail: false,

      newDescription: '',
      editDescription: false,

      file: null,
      imagePreviewUrl: '',
    });
  }


  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    const buttonEnabled = !(this.state.file || this.state.newUsername || this.state.newEmail || this.state.newDescription);

    const currImage = () => {
      if (this.state.imagePreviewUrl) {
        return (
          <img
            src={this.state.imagePreviewUrl}
            alt="Avatar" className="profile-photo-upload-image" />
        )
      } else if (this.props.avatarURL === './assets/roboheadwhite.png') {
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

    const editUsername = () => {
      if (this.state.editUsername) {
        return (
          <span style={{ display: 'flex', alignContent: 'center' }}>
            <AccountCircle style={{ marginRight: '10px' }} />
            <TextField
              type="username"
              placeholder="New Username"
              autoFocus={true}
              onChange={this.enterUsername.bind(this)}
              style={{ width: 'calc(100% - 40px)' }}
            />
          </span>
        )
      } else {
        return (
          <span style={{ display: 'flex', alignContent: 'center' }}>
            <AccountCircle style={{ marginRight: '10px' }} />
            {this.props.username}
            <Edit style={{ float: 'right', cursor: 'pointer', marginLeft: 'auto' }} onClick={this.editUsername.bind(this)} />
          </span>
        )
      }
    };

    const editEmail = () => {
      if (this.state.editEmail) {
        return (
          <span style={{ display: 'flex', alignContent: 'center' }}>
            <Email style={{ marginRight: '10px' }} />
            <TextField
              type="email"
              placeholder="New Email Address"
              autoFocus={true}
              onChange={this.enterEmail.bind(this)}
              style={{ width: 'calc(100% - 40px)' }}
            />
          </span>
        )
      } else {
        return (
          <span style={{ display: 'flex', alignContent: 'center' }}>
            <Email style={{ marginRight: '10px' }} />
            {(this.props.email) ?
              this.props.email :
              <p style={{ color: 'gray' }}> Add email address... </p>}
            {(this.props.isGoogleAccount) ?
              null :
              <Edit
                style={{ float: 'right', cursor: 'pointer', marginLeft: 'auto' }}
                onClick={this.editEmail.bind(this)} />
            }
          </span >
        )
      }
    };

    const editDescription = () => {
      if (this.state.editDescription) {
        return (<textarea style={{ color: 'white', background: 'rgba(30, 30, 30, .7)', marginBottom: '10px' }}
          class="textarea" placeholder="Description" rows="3"
          onChange={this.enterDescription.bind(this)}></textarea>)
      } else {
        return (
          <div style={{ display: 'flex', alignContent: 'center', marginBottom: '10px' }}>
            {(this.props.description) ?
              this.props.description :
              <p style={{ color: 'gray' }}>Add bio...</p>}
            <Edit style={{ float: 'right', cursor: 'pointer', marginLeft: 'auto' }} onClick={this.editDescription.bind(this)} />
          </div>
        )
      }
    }

    return (
      <div style={{
        display: 'flex',
        alignContent: 'flex-start',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div className="profile-photo-upload-container">
          {currImage()}
          <div className="profile-photo-upload-middle">
            <input id="photo-upload-input" type="file"
              accept="image/*"
              onChange={this.handlePhotoChange.bind(this)}
              style={{ display: 'none' }} />
            <label id="photo-upload-input-proxy" for="photo-upload-input">Upload Photo</label>
          </div>
        </div>
        <div
          className="user-profile-edit-area">
          <div>
            {editUsername()}
          </div>
          <div>
            {editEmail()}
          </div>
          <Divider style={{ margin: '0px 0px 15px 0px' }} />
          <div>
            {editDescription()}
          </div>
          <Button variant="contained" color="secondary" aria-label="add"
            disabled={buttonEnabled}
            style={{ float: 'right' }}
            onClick={this.updateProfile.bind(this)}>
            Update Profile
          </Button>
        </div>

        {/* UPDATED ALERT */}
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={this.state.open}
          autoHideDuration={3000}
          onClose={this.handleClose.bind(this)}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">Profile updated.</span>}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={this.handleClose.bind(this)}>
              <CloseIcon />
            </IconButton>,
          ]}
        />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserProfile);