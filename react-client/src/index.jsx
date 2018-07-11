import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import axios from 'axios';
import { composeWithDevTools } from 'redux-devtools-extension';
import io from 'socket.io-client';
import { withRouter } from 'react-router-dom';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Particles from 'react-particles-js';
import Navbar from './components/Navbar.jsx';
import MainView from './components/MainView.jsx';
import SignupPage from './components/AuthUserMenu/SignupPage.jsx';
import Splash from './components/Splash.jsx';

import 'animate.css/animate.css';
import './styles/main.scss';


// ─── REDUX STUFF ────────────────────────────────────────────────────────────────
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { login, logout, searchUsers, removeAllUsersFromNewRoom } from '../../redux/actions';
import reducer from '../../redux/reducer';

// redux devtools

const composeEnhancers = composeWithDevTools({});
const store = createStore(reducer, composeEnhancers());

const mapStateToProps = state => {
  return {
    loggedInUsername: state.username,
    searchedUsers: state.searchedUsers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    login: (username, email, isGoogleAccount, avatarURL, description, friends) => {
      return dispatch(login(username, email, isGoogleAccount, avatarURL, description, friends));
    },
    logout: () => dispatch(logout()),
    searchUsers: (users) => dispatch(searchUsers(users)),
    removeAllUsersFromNewRoom: () => dispatch(removeAllUsersFromNewRoom()),
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
  overrides: {
    MuiPaper: {
      root: {
        backgroundColor: 'rgba(0, 0, 0, .5)',
      }
    }
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
    title: {
      fontFamily: '"Titillium Web", sans-serif',
      fontWeight: 500,
    }
  }
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
    this.socket = io();
  }

  async componentDidMount() {
    const res = await axios.get('/checklogin')
    if (res.data.user) {
      this.props.login(res.data.user.username,
        res.data.user.email,
        res.data.user.is_google_account,
        res.data.user.avatar,
        res.data.user.description,
        res.data.user.friends);
      this.setState({
        loginError: false,
      });
    }
  }

  updateQuery(e) {
    this.setState({
      query: e.target.value,
    });
  }

  async searchUsers(query) {
    const res = await axios.post('/searchUsers', { query })
    this.props.searchUsers(res.data);
  }


  //
  // ─── USER AUTH ──────────────────────────────────────────────────────────────────
  //
  subscribe(username, email, password, zip) {
    axios.post('/subscribe', {
      username,
      email,
      password,
    })
      .then((res) => {
        const data = JSON.parse(res.config.data);
        data.avatarURL = './assets/roboheadwhite.png';
        data.friends = [];
        data.description = 'Description...';
        data.isGoogleAccount = false;
        if (res) {
          this.props.login(
            data.username,
            data.email,
            data.isGoogleAccount,
            data.avatarURL,
            data.description,
            data.friends
          );
        };
      })
      .catch(() => {
        this.setState({
          subscribeError: true
        });
      });
  }

  async login(usernameOrEmail, password) {
    const res = await axios.post('/login', {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password
    })

    if (res.config.data) {
      this.props.login(JSON.parse(res.config.data).username);
    }
  }

  async logout() {
    await axios.get('/logout')

    this.props.logout();
    this.props.removeAllUsersFromNewRoom();
    this.setState({
      loginError: false
    });

    this.socket.emit('leaveRoom', this.props.loggedInUsername)
  }

  profileRedirect() {
    this.props.history.push(`/userprofile/${this.props.loggedInUsername}`)
  }

  aboutDialogue() {
    console.log("ABOUT DIALOGUE HIT!!!")
    this.setState({
      aboutDialogue: true
    })
  }

  handleCloseAbout() {
    this.setState({ aboutDialogue: false });
  };

  // ────────────────────────────────────────────────────────────────────────────────


  render() {
    let loggedIn = this.props.loggedInUsername.length > 0;
    return (
      <BrowserRouter>
        <div>

          {/* PARTICLES */}
          <Particles
            params={{
              "particles": {
                "number": {
                  "value": 40,
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
                  "value": 3,
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
                  "speed": 1,
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
              background: '#000000', /* fallback for old browsers */
              // background: '-webkit-linear-gradient(to top, #202020, black 10%',  /* Chrome 10-25, Safari 5.1-6 */
              // background: 'linear-gradient(to top, #202020, black 10%)', /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
              // backgroundSize: 'cover',
            }} />


          {/* MAIN */}
          {(this.props.loggedInUsername) ?
            <div id="navbar-wrapper">
              <Navbar
                aboutDialogue={this.aboutDialogue.bind(this)}
                logout={this.logout.bind(this)}
                wins={this.state.userWins}
                profile={this.profileRedirect.bind(this)} />
            </div>
            : null
          }
          <div className="container">
            <Route path="/" render={
              (props) => (loggedIn) ?
                <MainView
                  handleCloseAbout={this.handleCloseAbout.bind(this)}
                  aboutDialogue={this.state.aboutDialogue}
                  searchedUsers={this.props.searchedUsers}
                  loggedIn={this.state.loggedIn}
                  loggedInUser={this.state.loggedInUsername}
                  userRooms={this.state.userRooms}
                  io={this.socket}
                  {...props} /> :
                <Splash
                  subscribe={this.subscribe.bind(this)}
                  login={this.login.bind(this)}
                  error={this.state.loginError}
                  subscribeError={this.state.subscribeError} />
            } />
            <Route exact path="/signup" render={
              (props) => <SignupPage
                subscribe={this.subscribe.bind(this)}
                {...props} />} />
          </div>
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
