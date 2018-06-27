module.exports = (sequelize, DataTypes) => {
  const RoomUsers = sequelize.define('room-users', {
    alias: DataTypes.STRING,
  });

  return RoomUsers;
};

