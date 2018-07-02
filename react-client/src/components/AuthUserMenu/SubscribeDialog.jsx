import React from 'react';
import validator from 'validator';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class SubscribeDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      email: '',
      emailValid: false,
      password: '',

      error: false
    };
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubscribe = this.handleSubscribe.bind(this);
    this.enterEmail = this.enterEmail.bind(this);
    this.enterPassword = this.enterPassword.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }


  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //
  handleClickOpen() {
    this.setState({
      open: true
    });
  }

  handleClose() {
    this.setState({
      open: false,
      email: '',
      emailValid: false,
      password: '',
    });
  }

  enterEmail(e) {
    if (validator.isEmail(e.target.value)) {
      this.setState({
        email: e.target.value,
        emailValid: true
      });
    } else {
      this.setState({
        email: e.target.value,
        emailValid: false
      });
    }
  }

  enterPassword(e) {
    this.setState({
      password: e.target.value
    });
  }

  handleSubscribe() {
    this.props.subscribe(
      this.state.email,
      this.state.password);
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.handleSubscribe();
    }
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if (prevState.open === false && this.state.open === true) {
  //     document.getElementById('subscribeEmail').focus();
  //   }
  // }


  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    // Toggle show modal
    const isActive = this.state.open ? (
      { className: 'modal is-active animated fadeIn' }
    ) : { className: 'modal animated fadeIn' };

    // Validate email field
    let isEmailValid = this.state.emailValid ? null : {
      error: true,
      helperText: 'Please enter a valid email address'
    };

    // Signup error
    // const subscribeError = this.props.subscribeError ? (
    //   <section className="section login-error">
    //     <div className="container">
    //       <h2 className="subtitle">
    //         That username is already taken.
    //           </h2>
    //     </div>
    //   </section>
    // ) : null;

    return (
      <div>
        <Button onClick={this.handleClickOpen} className="auth-button">Signup</Button>
        <Dialog
          className="auth-dialog"
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">
            Sign Up
          </DialogTitle>
          <DialogContent>
            <TextField
              {...isEmailValid}
              label="Email"
              // InputLabelProps={{
              //   shrink: true,
              // }}
              fullWidth
              autoFocus={true}
              onChange={this.enterEmail}
            />
            <TextField
              label="Password"
              // InputLabelProps={{
              //   shrink: true,
              // }}
              fullWidth
              type="password"
              onChange={this.enterPassword}
              onKeyUp={this.handleKeyPress}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} >
              Cancel
            </Button>
            <Button onClick={this.handleSubscribe} >
              Signup
            </Button>
          </DialogActions>
        </Dialog>
      </div >
    );
  }
}

export default SubscribeDialog;