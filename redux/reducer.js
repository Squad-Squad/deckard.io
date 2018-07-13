const initialState = {
  loggedIn: false,

  username: '',
  email: '',
  isGoogleAccount: false,
  avatarURL: '',
  description: '',
  friends: [],

  searchedUsers: [],
  usersForNewRoom: [],
  roomMode: '',
  roomBot: '',
  roomLength: '',

  currRoomUsers: [],

  aboutDialogOpen: false,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    //
    // ─── AUTHENTICATION ──────────────────────────────────────────────
    //
    case 'USER_LOGGED_IN':
      return Object.assign({}, state, {
        loggedIn: true,
      }, action.payload);

    case 'USER_LOGGING_OUT':
      return Object.assign({}, state, {
        loggedIn: false,
        username: '',
        email: '',
        isGoogleAccount: '',
        avatarURL: '',
        description: '',
      });


    //
    // ─── FRIENDS ─────────────────────────────────────────────────────
    //
    case 'ADD_FRIEND':
      if (!state.friends.includes(action.payload.friend)) {
        return Object.assign({}, state, {
          friends: state.friends.concat([action.payload.friend]),
        });
      } return state;


    //
    // ─── ROOM CREATION ───────────────────────────────────────────────
    //
    case 'SEARCH_USERS':
      return Object.assign({}, state, action.payload);

    case 'ADD_USER_TO_NEW_ROOM':
      if (!state.usersForNewRoom.includes(action.payload.username)) {
        return Object.assign({}, state, {
          usersForNewRoom: state.usersForNewRoom.concat([action.payload.username]),
        });
      } return state;

    case 'REMOVE_USER_FROM_NEW_ROOM':
      const copy = state.usersForNewRoom.slice(0);
      copy.splice(copy.indexOf(action.payload.username), 1);
      return Object.assign({}, state, {
        usersForNewRoom: copy,
      });

    case 'REMOVE_ALL_USERS_FROM_NEW_ROOM':
      return Object.assign({}, state, {
        usersForNewRoom: [],
      });

    case 'CHOOSE_ROOM_MODE':
      return Object.assign({}, state, action.payload);

    case 'CHOOSE_ROOM_BOT':
      return Object.assign({}, state, action.payload);

    case 'CHOOSE_ROOM_LENGTH':
      return Object.assign({}, state, action.payload);


    //
    // ─── ROOM LOGIC ──────────────────────────────────────────────────
    //
    case 'ADD_CURR_ROOM_USERS_FROM_DB':
      return Object.assign({}, state, {
        currRoomUsers: action.payload,
      });

    //
    // ─── RENDER LOGIC ───────────────────────────────────────────────────────────────
    //
    case 'OPEN_ABOUT_DIALOG':
      return Object.assign({}, state, {
        aboutDialogOpen: true,
      });

    case 'CLOSE_ABOUT_DIALOG':
      return Object.assign({}, state, {
        aboutDialogOpen: false,
      });

    default:
      return state;
  }
}

export default reducer;
