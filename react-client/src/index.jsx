import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { BrowserRouter, Route } from 'react-router-dom';
import axios from 'axios';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Particles from 'react-particles-js';

import Navbar from './components/Navbar.jsx';
import MainView from './components/MainView.jsx'
import SignupPage from './components/AuthUserMenu/SignupPage.jsx';
import Room from './components/Room.jsx';

import 'animate.css/animate.css';
import './styles/main.scss';


// ─── REDUX STUFF ────────────────────────────────────────────────────────────────
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import logger from 'redux-logger';
import { login, logout, searchUsers } from '../../redux/actions';
import reducer from '../../redux/reducer';

const store = createStore(reducer, applyMiddleware(logger));

const mapStateToProps = state => {
  return {
    loggedInUsername: state.username,
    searchedUsers: state.searchedUsers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    login: (username) => dispatch(login(username)),
    logout: () => dispatch(logout()),
    searchUsers: (users) => dispatch(searchUsers(users)),
  };
};


//
// ─── MATERIAL UI THEMING ────────────────────────────────────────────────────────
//
const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#212121',
      light: '#ffffff',
      dark: '#bcbcbc'
    },
    secondary: {
      main: '#eeeeee',
      light: '#8e8e8e',
      dark: '#373737'
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
  },
});

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
});
// ────────────────────────────────────────────────────────────────────────────────


class ConnectedApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      restaurants: [],

      loggedIn: false,
      loggedInUsername: '',
      loginError: false,

      userRooms: [],
      userWins: ''
    };
  }

  componentDidMount() {
    axios.get('/checklogin')
      .then(res => {
        if (res.data.user) {
          console.log('Logged in as:', res.data.user.email);
          this.props.login(res.data.user.email);
          this.setState({
            loginError: false,
          });
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
        this.props.searchUsers(res.data);
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
  subscribe(email, password, zip) {
    console.log(`Subscribe with ${email} and ${password}`);
    axios.post('/subscribe', {
      email,
      password,
      zip
    })
      .then((res) => {
        const email = JSON.parse(res.config.data).email;
        if (res) {
          this.props.login(email);
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
          this.props.login(JSON.parse(res.config.data).email);
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
        this.props.logout();
        this.setState({
          loginError: false
        });
      })
  }
  // ────────────────────────────────────────────────────────────────────────────────


  render() {
    let loggedIn = this.props.loggedInUsername.length > 0;
    return (
      <BrowserRouter>
        <div>
          <Particles
            params={{
              "particles": {
                "number": {
                  "value": 20,
                  "density": {
                    "enable": true,
                    "value_area": 800
                  }
                },
                "color": {
                  "value": "#ffffff"
                },
                "shape": {
                  "type": "circle",
                  "stroke": {
                    "width": 0,
                    "color": "#000000"
                  },
                  "polygon": {
                    "nb_sides": 5
                  },
                  "image": {
                    "src": "img/github.svg",
                    "width": 100,
                    "height": 100
                  }
                },
                "opacity": {
                  "value": 0.5,
                  "random": false,
                  "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                  }
                },
                "size": {
                  "value": 4,
                  "random": true,
                  "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                  }
                },
                "line_linked": {
                  "enable": true,
                  "distance": 120,
                  "color": "#ffffff",
                  "opacity": 0.4,
                  "width": 1
                },
                "move": {
                  "enable": true,
                  "speed": 3,
                  "direction": "none",
                  "random": false,
                  "straight": false,
                  "out_mode": "out",
                  "bounce": false,
                  "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                  }
                }
              },
              "interactivity": {
                "detect_on": "canvas",
                "events": {
                  "onhover": {
                    "enable": true,
                    "mode": "grab"
                  },
                  "onclick": {
                    "enable": true,
                    "mode": "push"
                  },
                  "resize": true
                },
                "modes": {
                  "grab": {
                    "distance": 107.8921078921079,
                    "line_linked": {
                      "opacity": 1
                    }
                  },
                  "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                  },
                  "repulse": {
                    "distance": 200,
                    "duration": 0.4
                  },
                  "push": {
                    "particles_nb": 4
                  },
                  "remove": {
                    "particles_nb": 2
                  }
                }
              },
              "retina_detect": true
            }}
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              zIndex: '-1',
              backgroundImage: 'url("../../dist/assets/deckardBG.jpg")',
              backgroundSize: 'cover',
            }} />
          <div>
            <Navbar
              login={this.login.bind(this)}
              logout={this.logout.bind(this)}
              subscribe={this.subscribe.bind(this)}
              error={this.state.loginError}
              subscribeError={this.state.subscribeError}
              wins={this.state.userWins} />
          </div >
          <Route path="/" render={
            (props) => (loggedIn) ?
              <MainView
                searchedUsers={this.props.searchedUsers}
                loggedIn={this.state.loggedIn}
                loggedInUser={this.state.loggedInUsername}
                userRooms={this.state.userRooms}
                {...props} /> :
              <Paper id="login-prompt">Login or signup to play.</Paper>} />
          <Route exact path="/signup" render={
            (props) => <SignupPage
              subscribe={this.subscribe.bind(this)}
              {...props} />} />
        </div>
      </BrowserRouter>
    );
  }
}

const App = connect(mapStateToProps, mapDispatchToProps)(ConnectedApp);

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider theme={theme}>
      <App />
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('app'));
