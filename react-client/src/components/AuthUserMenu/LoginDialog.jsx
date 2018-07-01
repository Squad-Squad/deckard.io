import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Icon from '@material-ui/core/Icon';

class LoginDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      email: '',
      password: '',
    };
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
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
      password: ''
    });
  }

  enterEmail(e) {
    this.setState({
      email: e.target.value
    });
  }

  enterPassword(e) {
    this.setState({
      password: e.target.value
    });
  }

  handleLogin() {
    this.props.login(this.state.email, this.state.password);
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.handleLogin();
    }
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if (prevState.open === false && this.state.open === true) {
  //     document.getElementById('loginEmail').focus();
  //   }
  // }

  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────────
  //
  render() {
    // Login error
    const loginError = this.props.error ? (
      <DialogContentText id="login-error">
        That user does not exist.
      </DialogContentText>
    ) : null;

    return (
      <div>
        <Button onClick={this.handleClickOpen} className="auth-buttons">Login</Button>
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogTitle id="login-form-dialog-title" >
              <span className="login-title">
                Login
                </span>
              <Button
                id="google-login-button"
                variant="raised"
                style={{ backgroundColor: '#4285f4', color: 'white' }}
                href='/auth/google'>
                <i className="fab fa-google"></i>
                <p style={{ paddingLeft: '15px' }}>Login With Google</p>
              </Button>
            </DialogTitle>
            <DialogContent>
              {loginError}
              <TextField
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
              <Button onClick={this.handleClose}>
                Cancel
          </Button>
              <Button onClick={this.handleLogin}>
                Login
          </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div >
    );
  }
}

export default LoginDialog;