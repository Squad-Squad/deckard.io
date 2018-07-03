import React, { Component } from 'react';
import placeholder from './../../../dist/assets/profile-placeholder.jpg';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
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

  render() {
    const currImage = this.state.imagePreviewUrl ? (
      <img
        src={this.state.imagePreviewUrl}
        alt="Avatar" className="profile-photo-upload-image" />
    ) :
      (
        <img
          src={"https://www.bsn.eu/wp-content/uploads/2016/12/user-icon-image-placeholder-300-grey.jpg"}
          alt="Avatar" className="profile-photo-upload-image" />
      )

    return (
      <div>
        <div className="profile-photo-upload-container">
          {currImage}
          <div className="profile-photo-upload-middle">
            <input id="photo-upload-input" type="file" accept="image/*"
              onChange={this.handlePhotoChange.bind(this)}
              style={{ display: 'none' }} />
            <label id="photo-upload-input-proxy" for="photo-upload-input">Upload Photo</label>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(UserProfile);