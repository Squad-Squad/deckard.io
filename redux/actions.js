const login = username => ({
  type: 'USER_LOGGED_IN',
  payload: { username },
});

const logout = () => ({
  type: 'USER_LOGGING_OUT',
});

const searchUsers = searchedUsers => ({
  type: 'SEARCH_USERS',
  payload: { searchedUsers },
});

module.exports = {
  login,
  logout,
  searchUsers,
};
