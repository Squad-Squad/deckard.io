const RoomUser = require('./room-users');

module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('room', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uniqueid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  Room.associate = (models) => {
    Room.belongsToMany(models.User, {
      through: models.RoomUser,
      foreignKey: 'room_id',
    });
    Room.belongsTo(models.User, {
      foreignKey: 'owner',
    });
  };

  return Room;
};
