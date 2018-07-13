import React, { Component } from 'react';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

const styles = theme => ({

});

class ScoresItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lineWait: true,
    }
  }

  componentDidMount() {
    setTimeout(() => this.setState({
      waiting: false,
    }), 1000);
    setTimeout(() => this.setState({
      lineWait: false,
    }), 500);
  }

  render() {
    const { classes } = this.props;

    console.log('WIDTH', this.props.scoreWidth)

    return ([
      <div>
        <div key={this.props.key} style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexDirection: 'column',
          paddingLeft: '15px',
          paddingRight: '15px',
          paddingTop: '15px',
          paddingBottom: '10px',
          fontSize: '18px',
        }}>
          <div>
            {this.props.user}{' '}(<strong>{this.props.alias}</strong>)
          </div>
          <div style={{
            width: String(this.props.scoreWidth) + '%',
          }}>
            <hr
              className={'trans--grow--score ' + (this.state.lineWait ? null : 'grow--score')}
              style={{
                backgroundColor: 'white',
                opacity: 1,
                marginTop: '10px',
                marginBottom: '10px',
                height: '14px',
              }} />
          </div>
          <div className="animated fadeIn"
            style={{ marginLeft: 'auto' }}>
            {this.props.score}
          </div>
        </div>
      </div>,
      <Divider />
    ]);
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(ScoresItem));