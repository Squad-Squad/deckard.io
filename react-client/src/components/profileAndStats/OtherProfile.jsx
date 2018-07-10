import React, { Component } from 'react';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Email from '@material-ui/icons/Email';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {
  };
}

class OtherProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  handleClose(event, reason) {
    if (reason === 'clickaway') return;
    this.setState({ open: false });
  }


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
      <div style={{
        display: 'flex',
        alignContent: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div className="profile-photo-upload-container">
          {currImage()}
        </div>
        <div
          className="other-user-profile-edit-area">
          <div>
            <span style={{
              display: 'flex',
              alignContent: 'center',
              justifyContent: 'center',
              fontSize: '25px',
              marginBottom: '20px'
            }}>
              {this.props.username}
            </span>
          </div>
          {/* <div>
            <span style={{ display: 'flex', alignContent: 'center' }}>
              <Email style={{ marginRight: '10px' }} />
              {this.props.email}
            </span >
          </div> */}
          <Divider style={{ margin: '0px 0px 15px 0px' }} />
          <div>
            <div style={{ display: 'flex', alignContent: 'center', marginBottom: '10px' }}>
              {this.props.description}
            </div>
          </div>
        </div>
      </div >
    );
  }
}

export default connect(
  mapStateToProps,
)(OtherProfile);