const initialState = {
  loggedIn: false,
  username: '',
  searchedUsers: [],

  // Also used to alias usernames once the room is created
  usersForNewRoom: [],
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
      });


    //
    // ─── ROOM CREATION ───────────────────────────────────────────────
    //
    case 'SEARCH_USERS':
      return Object.assign({}, state, action.payload);

    case 'ADD_USER_TO_NEW_ROOM':
      return Object.assign({}, state, {
        usersForNewRoom: state.usersForNewRoom.concat([action.payload.username]),
      });

    case 'REMOVE_USER_FROM_NEW_ROOM':
      // THIS CONSOLE LOG IS NECESSARY, DON'T REMOVE
      console.log('UPDATED ARRAY', state.usersForNewRoom.splice(state.usersForNewRoom.indexOf(action.payload.username), 1));
      return Object.assign({}, state, {
        usersForNewRoom: state.usersForNewRoom.splice(state.usersForNewRoom.indexOf(action.payload.username), 1),
      });


    default:
      return state;
  }
}

export default reducer;
