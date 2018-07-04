import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';

function rand() {
  return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
  return {
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%)`,
  };
}

const styles = theme => ({
  paper: {
    position: 'absolute',

    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
  },
});

class InviteDialogue extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
    };

    this.roomID = this.props.match.params.roomID

  }

  handleOpen = () => {
    this.setState({ open: true });
  };


  render() {
    const { classes } = this.props;
    return (
      <div>
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={this.props.addOpen}
          onClose={this.props.handleClose}
        >
          <div style={getModalStyle()} className={classes.paper}>
            <Typography variant="subheading" id="simple-modal-description">
              You've Been Invited to Play with {this.props.host}!
            </Typography>
            <Button><a href={`/rooms/${this.props.roomHash}`}>Join Room</a></Button>
            <Button onClick={()=>{this.props.decline(this.props.roomHash)}}>Decline</Button>
          </div>
        </Modal>
      </div>
    );
  }
}


// We need an intermediary variable for handling the recursive nesting.
const InviteDialogueWrapped = withStyles(styles)(InviteDialogue);

export default InviteDialogueWrapped;