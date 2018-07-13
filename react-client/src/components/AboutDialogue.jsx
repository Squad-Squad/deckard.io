import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class AboutDialogue extends React.Component {
  constructor(props) {
    super(props);
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
        open={this.props.openStatus}
        onClose={this.props.handleCloseAbout}
        scroll={this.state.scroll}
        aria-labelledby="scroll-dialog-title"
        PaperProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, .9)',
          },
        }}
      >
        <DialogTitle id="scroll-dialog-title">Rules/About</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>About</strong>
            <p>
              Deckard.io is a game inspired by Alan Turing's canonical{' '}
              <a href="https://en.wikipedia.org/wiki/Turing_test">Turing Test</a> but with a unique
              spin, instead of just a computer trying to fool a human, in Deckard.io, you are a
              human trying to fool other humans into thinking you are a computer. We call this The
              Reverse Turing Test. The name is inspired by the famous cyberpunk movie{' '}
              <a href="https://www.imdb.com/title/tt0083658/">Blade Runner</a>. It is an open source
              application created by <a href="https://github.com/Squad-Squad">Squad Squad</a>
            </p>
            <br />
            <strong>Rules</strong>
            <p>
              Objectives:
              <ul>
                <li>
                  1. Guess who the actual chatbot is in the chatroom. You get points if you guess
                  correctly
                </li>
                <li>
                  2. Have the other humans in the chatroom guess that you are the A.I. Chatbot
                </li>
              </ul>
            </p>

            {/* Deckard IO is a game imagined in the vain of Alan Turing's canonical Turing Test.
            Players are thrown in an anonymous chatroom together. One player is a bot, the rest
            Hyumons. Hyumons get points whent the get the others to guess that they are a bot and
            when they guess which player is the bot. */}
          </DialogContentText>
        </DialogContent>
        <Button onClick={this.handleClose} color="primary">
          Close
        </Button>
      </Dialog>
    );
  }
}

export default AboutDialogue;
