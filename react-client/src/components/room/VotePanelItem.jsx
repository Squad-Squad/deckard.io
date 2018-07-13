import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
});

function mapStateToProps(state) {
  return {

  };
}

class VotePanelItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      humanOrAI: '',
    };
  }

  humanClick() {
    this.setState({
      humanOrAI: 'human',
    }, () => {
      this.props.setVote(this.props.user, this.state.humanOrAI);
    });
  }

  aiClick() {
    this.setState({
      humanOrAI: 'ai',
    }, () => {
      this.props.setVote(this.props.user, this.state.humanOrAI);
    });
  }

  render() {
    const { classes } = this.props;

    const buttons = () => {
      if (this.state.humanOrAI === '') {
        return ([
          <Button variant="contained" color="primary" className={classes.button}
            onClick={this.aiClick.bind(this)}>
            A.I.
              </Button>,
          <Button variant="contained" color="secondary" className={classes.button}
            onClick={this.humanClick.bind(this)}>
            Human
          </Button>
        ])
      } else if (this.state.humanOrAI === 'ai') {
        return ([
          <Button variant="contained" color="primary" className={classes.button}
            onClick={this.aiClick.bind(this)}>
            A.I.
          </Button>,
          <span onClick={this.humanClick.bind(this)}>
            <Button variant="contained" color="secondary" disabled className={classes.button}>
              Human
            </Button>
          </span>
        ])
      } else {
        return ([
          <span onClick={this.aiClick.bind(this)}>
            <Button variant="contained" color="primary" disabled className={classes.button}>
              A.I.
            </Button>
          </span>,
          <Button variant="contained" color="secondary" className={classes.button}
            onClick={this.humanClick.bind(this)}>
            Human
          </Button>
        ])
      }
    }

    return (
      [<div style={{ display: 'flex', justifyContent: 'space-between' }}
        key={this.props.thisKey}>
        <div>
          <p style={{
            padding: '15px',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <img
              src={`../assets/aliasImages/${this.props.user}.jpg`}
              style={{
                objectFit: 'cover',
                borderRadius: '50%',
                height: '40px',
                width: '40px',
                marginRight: '10px',
              }} />
            {this.props.user}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {buttons()}
        </div>
      </div>,
      <Divider key={1000} />]
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VotePanelItem));