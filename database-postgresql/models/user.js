module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    wins: {
      type: DataTypes.INTEGER(6),
      defaultValue: 0,
      allowNull: true,
    },
  });

  User.associate = (models) => {
    User.belongsToMany(models.Room, {
      through: models.RoomUser,
      foreignKey: 'user_id',
    });
  };

  return User;
};
