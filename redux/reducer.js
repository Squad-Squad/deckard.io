const initialState = {
  loggedIn: false,

  username: '',
  avatarURL: '',
  isGoogleAccount: false,

  searchedUsers: [],
  usersForNewRoom: [],
  currRoomUsers: [],
};

function reducer(state = initialState, action) {
  switch (action.type) {
    //
    // ─── AUTHENTICATION ──────────────────────────────────────────────
    //
    case 'USER_LOGGED_IN':
      console.log('USER LOGIN PAYLOAD', action.payload);
      return Object.assign({}, state, {
        loggedIn: true,
      }, action.payload);

    case 'USER_LOGGING_OUT':
      return Object.assign({}, state, {
        loggedIn: false,
        username: '',
        avatarURL: '',
      });


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
      // THIS CONSOLE LOG IS NECESSARY, DON'T REMOVE
      console.log('UPDATED ARRAY', state.usersForNewRoom.splice(state.usersForNewRoom.indexOf(action.payload.username), 1));
      return Object.assign({}, state, {
        usersForNewRoom: state.usersForNewRoom.splice(state.usersForNewRoom.indexOf(action.payload.username), 1),
      });

    case 'REMOVE_ALL_USERS_FROM_NEW_ROOM':
      // THIS CONSOLE LOG IS NECESSARY, DON'T REMOVE
      return Object.assign({}, state, {
        usersForNewRoom: [],
      });


    //
    // ─── ROOM LOGIC ──────────────────────────────────────────────────
    //
    case 'ADD_CURR_ROOM_USERS_FROM_DB':
      return Object.assign({}, state, {
        currRoomUsers: action.payload,
      });


    default:
      return state;
  }
}

export default reducer;
