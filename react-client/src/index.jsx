import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { BrowserRouter, Route, Link } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar.jsx';
import MainView from './components/MainView.jsx'
import SignupPage from './components/AuthUserMenu/SignupPage.jsx';
import Room from './components/Room.jsx';

import 'animate.css/animate.css';
import './styles/main.scss';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      restaurants: [],

      loggedIn: false,
      loggedInUsername: '',
      loginError: false,

      searchedUsers: [],
      userRooms: [],
      userWins: ''
    };
  }

  componentDidMount() {
    axios.get('/checklogin')
      .then(res => {
        if (res.data.user) {
          console.log('Logged in as:', res.data.user.email);
          this.setState({
            loggedIn: true,
            loggedInUsername: res.data.user.email,
            loginError: false,
          });
          this.getUserRooms(res.data.user.email);
          this.getUserWins(res.data.user.email);
        }
      });
  }

  updateQuery(e) {
    this.setState({
      query: e.target.value,
    });
  }

  searchUsers(query) {
    console.log('SEARCHING FOR', query);
    axios.post('/searchUsers', { query })
      .then(res => {
        console.log('RESULTS', res);
        this.setState({
          searchedUsers: res.data
        });
      });
  }

  getUserRooms(email) {
    axios.post('/api/userrooms', { username: email })
      .then(res => {
        this.setState({
          userRooms: res.data
        })
      })
  }

  getUserWins(email) {
    axios.post('/api/userwins', { username: email })
      .then(res => {
        this.setState({
          userWins: res.data
        })
      })
  }

  //
  // ─── USER AUTH ──────────────────────────────────────────────────────────────────
  //
  subscribe(email, password) {
    console.log(`Subscribe with ${email} and ${password}`);
    axios.post('/subscribe', {
      email,
      password,
    })
      .then((res) => {
        const email = JSON.parse(res.config.data).email;
        if (res) {
          this.setState({
            loggedIn: true,
            loggedInUsername: email
          })
        }
      })
      .catch(() => {
        this.setState({
          subscribeError: true
        });
      });
  }

  login(email, password) {
    console.log(`Login with ${email} and ${password}`);
    axios.post('/login', {
      email,
      password
    })
      .then(res => {
        if (res.config.data) {
          console.log('Logged in as:', JSON.parse(res.config.data).email);
          this.getUserRooms(JSON.parse(res.config.data).email);
          this.getUserWins(JSON.parse(res.config.data).email);
          this.setState({
            loggedIn: true,
            loggedInUsername: JSON.parse(res.config.data).email
          });
        }
      })
      .catch(
        (error => {
          console.log(this);
          this.setState({
            loginError: true
          });
        })()
      );
  }

  logout() {
    axios.get('/logout')
      .then(res => {
        console.log('Logging out');
        this.setState({
          loggedIn: false,
          loggedInUsername: '',
          loginError: false
        });
      })
  }
  // ────────────────────────────────────────────────────────────────────────────────


  render() {
    let room = this.state.loggedInUsername
      ? <Route path="/rooms/:roomID" render={(props) => <Room username={this.state.loggedInUsername} {...props} />} />
      : ''
    return (
      <BrowserRouter>
        <div>
          <div>
            <Navbar
              login={this.login.bind(this)}
              logout={this.logout.bind(this)}
              subscribe={this.subscribe.bind(this)}
              loggedIn={this.state.loggedIn}
              username={this.state.loggedInUsername}
              error={this.state.loginError}
              subscribeError={this.state.subscribeError}
              wins={this.state.userWins} />
          </div >
          <Route exact path="/" render={
            (props) => <MainView
              searchUsers={this.searchUsers.bind(this)}
              searchedUsers={this.state.searchedUsers}
              loggedIn={this.state.loggedIn}
              loggedInUser={this.state.loggedInUsername}
              userRooms={this.state.userRooms}
              {...props} />} />
          <Route path="/signup" render={
            (props) => <SignupPage
              subscribe={this.subscribe.bind(this)}
              {...props} />} />
          {room}
        </div>
      </BrowserRouter>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
