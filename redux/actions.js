//
// ─── AUTHENTICATION ─────────────────────────────────────────────────────────────
//
const login = username => ({
  type: 'USER_LOGGED_IN',
  payload: { username },
});

const logout = () => ({
  type: 'USER_LOGGING_OUT',
});


//
// ─── ROOM CREATION ──────────────────────────────────────────────────────────────
//
const searchUsers = searchedUsers => ({
  type: 'SEARCH_USERS',
  payload: { searchedUsers },
});

const addUserToNewRoom = username => ({
  type: 'ADD_USER_TO_NEW_ROOM',
  payload: { username },
});

const removeUserFromNewRoom = username => ({
  type: 'REMOVE_USER_FROM_NEW_ROOM',
  payload: { username },
});

module.exports = {
  login,
  logout,
  searchUsers,
  addUserToNewRoom,
  removeUserFromNewRoom,
};
