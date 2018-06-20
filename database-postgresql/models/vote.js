module.exports = (sequelize, DataTypes) => {
  const Vote = sequelize.define('vote', {
    restaurant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    roomuniqueid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    useremail: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nominator: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    upvoted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    created: {
      type: 'timestamp',
    },
    updated: {
      type: 'timestamp'
    },
  }, 
  {
    timestamps: false
  });

  return Vote;
};
