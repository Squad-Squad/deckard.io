const initialState = {
  loggedIn: false,
  username: '',
  searchedUsers: [],
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      return Object.assign({}, state, {
        loggedIn: true,
      }, action.payload);
    case 'USER_LOGGING_OUT':
      return Object.assign({}, state, {
        loggedIn: false,
        username: '',
      });
    case 'SEARCH_USERS':
      return Object.assign({}, state, action.payload);
    default:
      return state;
  }
}

export default reducer;
