import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Email from '@material-ui/icons/Email';
import Edit from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import placeholder from './../../../dist/assets/profile-placeholder.jpg';
import { connect } from 'react-redux';
import axios from 'axios';

function mapStateToProps(state) {
  return {

  };
}

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editUsername: false,
      newUsername: '',

      editEmail: false,
      newEmail: '',

      file: null,
      imagePreviewUrl: null,
    };
  }

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

  updateProfile() {
    const data = new FormData();
    data.append('avatar', this.state.file);
    console.log('DATA', data);
    axios({
      method: 'post',
      url: '/profile/save-image',
      data,
      config: { headers: { 'Content-Type': 'multipart/form-data' } }
    });
  }

  render() {
    console.log('PROPS', this.props);
    const currImage = () => {
      if (this.state.imagePreviewUrl) {
        return (
          <img
            src={this.state.imagePreviewUrl}
            alt="Avatar" className="profile-photo-upload-image" />
        )
      } else {
        return (
          <img
            src={"https://www.bsn.eu/wp-content/uploads/2016/12/user-icon-image-placeholder-300-grey.jpg"}
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
            {this.props.email}
            <Edit style={{ float: 'right', cursor: 'pointer', marginLeft: 'auto' }} onClick={this.editEmail.bind(this)} />
          </span >
        )
      }
    };

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignContent: 'flex-start' }}>
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
            <textarea style={{ color: 'white', background: 'rgba(30, 30, 30, .7)' }}
              class="textarea" placeholder="Description" rows="3"></textarea>
          </div>
          <Button variant="contained" color="secondary" aria-label="add"
            style={{ float: 'right' }}
            onClick={this.updateProfile.bind(this)}>
            Update Profile
          </Button>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(UserProfile);