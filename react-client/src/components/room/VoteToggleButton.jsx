import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

const styles = theme => ({
  aiButton: {
    margin: '0px',
    borderRadius: '5px 0px 0px 5px',
  },
  humanButton: {
    margin: '0px',
    borderRadius: '0px 5px 5px 0px',
  },
});

class VoteToggleButton extends Component {
  render() {
    const { classes } = this.props;

    const buttons = () => {
      if (this.props.humanOrAI === '') {
        return ([
          <Button variant="contained" color="primary" className={classes.aiButton}
            onClick={this.props.aiClick}>
            A.I.
              </Button>,
          <Button variant="contained" color="secondary" className={classes.humanButton}
            onClick={this.props.humanClick}>
            Human
          </Button>
        ])
      } else if (this.props.humanOrAI === 'ai') {
        return ([
          <Button variant="contained" color="primary" className={classes.aiButton}
            onClick={this.props.aiClick}>
            A.I.
          </Button>,
          <span onClick={this.props.humanClick}>
            <Button variant="contained" color="secondary" disabled className={classes.humanButton}>
              Human
            </Button>
          </span>
        ])
      } else {
        return ([
          <span onClick={this.props.aiClick}>
            <Button variant="contained" color="primary" disabled className={classes.aiButton}>
              A.I.
            </Button>
          </span>,
          <Button variant="contained" color="secondary" className={classes.humanButton}
            onClick={this.props.humanClick}>
            Human
          </Button>
        ])
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginRight: '15px',
        }}>
        {buttons()}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VoteToggleButton));