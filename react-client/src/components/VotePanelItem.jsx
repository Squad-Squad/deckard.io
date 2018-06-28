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
    });
  }

  aiClick() {
    this.setState({
      humanOrAI: 'ai',
    });
  }

  render() {
    const { classes } = this.props;

    const buttons = () => {
      if (this.state.humanOrAI === '') {
        return (<div>
          <Button variant="contained" color="primary" className={classes.button}
            onClick={this.aiClick.bind(this)}>
            A.I.
              </Button>
          <Button variant="contained" color="secondary" className={classes.button}
            onClick={this.humanClick.bind(this)}>
            Hyumon
              </Button>
        </div>)
      } else if (this.state.humanOrAI === 'ai') {
        return (<div>
          <Button variant="contained" color="primary" className={classes.button}
            onClick={this.aiClick.bind(this)}>
            A.I.
              </Button>
          <Button variant="contained" color="secondary" disabled className={classes.button}
            onClick={this.humanClick.bind(this)}>
            Hyumon
              </Button>
        </div>)
      } else {
        return (<div>
          <Button variant="contained" color="primary" disabled className={classes.button}
            onClick={this.aiClick.bind(this)}>
            A.I.
              </Button>
          <Button variant="contained" color="secondary" className={classes.button}
            onClick={this.humanClick.bind(this)}>
            Hyumon
              </Button>
        </div>)
      }
    }

    return (
      [<div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><p style={{
          paddingLeft: '15px',
          paddingTop: '15px',
          paddingBottom: '10px',
          fontSize: '20px',
        }}>{this.props.user}</p></div>
        {buttons()}
      </div>,
      <Divider />]
    );
  }
}

export default connect(
  mapStateToProps,
)(withStyles(styles)(VotePanelItem));