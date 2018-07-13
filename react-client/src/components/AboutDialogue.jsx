import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { closeAboutDialog } from '../../../redux/actions';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    loggedInUsername: state.username,
    searchedUsers: state.searchedUsers,
    aboutDialogOpen: state.aboutDialogOpen
  };
};

const mapDispatchToProps = dispatch => {
  return {
    closeAboutDialog: () => dispatch(closeAboutDialog()),
  };
};

class AboutDialogue extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      scroll: 'paper',
    };
  }

  handleClickOpen = scroll => () => {
    this.setState({ open: true, scroll });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    return (
      <Dialog
        open={this.props.aboutDialogOpen}
        onClose={this.props.closeAboutDialog}
        scroll={this.state.scroll}
        aria-labelledby="scroll-dialog-title"
        PaperProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, .9)',
          },
        }}
      >
        <DialogTitle id="scroll-dialog-title">Rules</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deckard IO is a game imagined in the vain of Alan Turing's canonical Turing Test.
            Players are thrown in an anonymous chatroom together.
            One player is a bot, the rest Hyumons. Hyumons get points whent the get the others
            to guess that they are a bot and when they guess which player is the bot.
            </DialogContentText>
        </DialogContent>
        <DialogTitle id="scroll-dialog-title">About</DialogTitle>
        <DialogContent>
          <DialogContentText>
            (c)2018 Squad-Squad Inc.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.closeAboutDialog} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AboutDialogue);