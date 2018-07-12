import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

function rand() {
  return Math.round(Math.random() * 20) - 10;
}

const styles = theme => ({
  paper: {
    position: 'absolute',
    backgroundColor: (0, 0, 0, .8),
    boxShadow: theme.shadows[5],
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
        <Dialog
          aria-labelledby="simple-dialog-title"
          aria-describedby="simple-modal-description"
          open={this.props.addOpen}
          onClose={this.props.handleClose}
          disableBackdropClick
          disableEscapeKeyDown
          PaperProps={{
            style: {
              backgroundColor: 'rgba(0, 0, 0, .9)'
            }
          }}
        >
          <DialogContent>
            <Typography variant="subheading" id="simple-modal-description">
              You've been invited to a room by {this.props.host}!
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { this.props.decline() }}>Decline</Button>
            <Button><a href={`/rooms/${this.props.roomHash}`}>Join Room</a></Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}


// We need an intermediary variable for handling the recursive nesting.
const InviteDialogueWrapped = withStyles(styles)(InviteDialogue);

export default InviteDialogueWrapped;