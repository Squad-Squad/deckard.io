import React, { Component } from 'react';
import { connect } from 'react-redux';
import Divider from '@material-ui/core/Divider';

function mapStateToProps(state) {
  return {

  };
}

class ChatMessage extends Component {
  render() {
    return (
      [
        <div className="section" key={this.props.i}
          style={{
            display: 'flex',
            textAlign: "left",
            borderTop: "1px solid black",
            padding: "10px",
            fontSize: "18px"
          }}>
          {
            (/joined the room/.test(this.props.message.message)) ? null :
              <img
                src={`../assets/aliasImages/${this.props.memberMap[this.props.message.name]}.jpg`}
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%',
                  height: '40px',
                  width: '40px',
                  marginRight: '10px',
                  marginTop: '6px',
                }} />
          }
          <div>
            <div>
              <strong>
                {this.props.memberMap[this.props.message.name]}
              </strong>
            </div>
            <div>
              <p>{this.props.message.message}</p>
            </div>
          </div>
        </div>,
        <Divider style={{
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, .2)',
          width: '80%',
          margin: 'auto'
        }} />
      ]
    );
  }
}

export default connect(
  mapStateToProps,
)(ChatMessage);