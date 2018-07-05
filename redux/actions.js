//
// ─── AUTHENTICATION ─────────────────────────────────────────────────────────────
//
const login = (username, email, isGoogleAccount, avatarURL, description) => ({
  type: 'USER_LOGGED_IN',
  payload: {
    username,
    email,
    isGoogleAccount,
    avatarURL,
    description,
  },
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

const removeAllUsersFromNewRoom = () => ({
  type: 'REMOVE_ALL_USERS_FROM_NEW_ROOM',
});


//
// ─── ROOM LOGIC ─────────────────────────────────────────────────────────────────
//
const addCurrRoomUsersFromDB = users => ({
  type: 'ADD_CURR_ROOM_USERS_FROM_DB',
  payload: { users },
});


module.exports = {
  login,
  logout,
  searchUsers,
  addUserToNewRoom,
  removeUserFromNewRoom,
  removeAllUsersFromNewRoom,
  addCurrRoomUsersFromDB,
};
