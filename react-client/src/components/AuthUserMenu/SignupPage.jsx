import React from 'react';
import validator from 'validator';
import { Link } from 'react-router-dom';

class SignupPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      email: null,
      emailValid: false,
      password: null,
    };
    this.handleSubscribe = this.handleSubscribe.bind(this);
    this.enterEmail = this.enterEmail.bind(this);
    this.enterPassword = this.enterPassword.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  enterUsername(e) {
    this.setState({
      username: e.target.value
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
        email: null,
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
    console.log(this.props.subscribe);
    this.props.subscribe(
      this.state.email,
      this.state.password);
  }

  handleKeyPress(event) {
    if (event.key == 'Enter') {
      this.handleSubscribe();
    }
  }

  render() {
    console.log('L:KSJDF');
    // Validate email field
    let isEmailValid1 = this.state.emailValid ? (
      { className: 'input is-success' }
    ) : { className: 'input is-danger' };

    let isEmailValid2 = this.state.emailValid ? null : (
      <p className="help is-danger">
        Please enter a valid email address.
      </p>
    );

    // Link only active if

    return (
      <div className="columns tile is-ancestor">
        <div className="column is-1"></div>
        <div id="google-login-container" className="column is-2">
          <div id="google-login-card" className="card">
            <header className="card-header">
              <p className="card-header-title">
                Login With Google
              </p>
            </header>
            <div className="card-content">
              <div id="google-login-content" className="content">
                <figure className="image is-128x128">
                  <img src="https://image.flaticon.com/icons/svg/270/270014.svg" />
                </figure>
              </div>
            </div>
            <footer className="card-footer">
              <a href="/auth/google" className="card-footer-item">Login</a>
            </footer>
          </div>
        </div>
        <div id="signup-or-container" className="column is-2">
          <p id="signup-or" className="title">OR</p>
        </div>
        <div className="column is-6 tile is-parent is-vertical">
          <div className="tile is-child notification">
            <p className="title">Sign Up!</p>
            <div className="is-divider" />
            <div className="field">
              <label className="label">Password</label>
              <p className="control has-icons-left">
                <input
                  className="input"
                  type="username"
                  placeholder="username"
                  value={this.state.username}
                  onChange={this.enterUsername}
                  onKeyPress={this.handleKeyPress} />
                <span className="icon is-small is-left">
                  <i className="fas fa-user"></i>
                </span>
              </p>
            </div>
            <div className="field">
              <label className="label">Email</label>
              <div className="control has-icons-left">
                <input
                  {...isEmailValid1}
                  type="email"
                  placeholder="johndoe@gmail.com"
                  value={this.state.email}
                  onChange={this.enterEmail}
                  onKeyPress={this.handleKeyPress} />
                <span className="icon is-small is-left">
                  <i className="fas fa-envelope"></i>
                </span>
              </div>
              {isEmailValid2}
            </div>
            <div className="field">
              <label className="label">Password</label>
              <p className="control has-icons-left">
                <input
                  className="input"
                  type="password"
                  placeholder="password123"
                  value={this.state.password}
                  onChange={this.enterPassword}
                  onKeyPress={this.handleKeyPress} />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
                </span>
              </p>
            </div>
            <div className="is-divider" />
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button
                className="button is-success is-fullwidth"
                onClick={this.handleSubscribe}>
                Go!
            </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default SignupPage;
