require('dotenv').config();

const Sequelize = require('sequelize');

const { Op } = Sequelize;

// set up connection and create sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  operatorsAliases: false,
  logging: false,
  // dialectOptions: {
  //   ssl: true,
  // },
});

// testing connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });


//
// ─── THESE CANT BE IN SEPARATE FILES ────────────────────────────────────────────
//
const User = sequelize.define('user', {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  wins: {
    type: Sequelize.INTEGER(6),
    defaultValue: 0,
    allowNull: true,
  },
});

const Room = sequelize.define('room', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  uniqueid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const RoomUsers = sequelize.define('room-users', {
  alias: Sequelize.STRING,
});

User.belongsToMany(Room, {
  through: RoomUsers,
});

Room.belongsToMany(User, {
  through: RoomUsers,
});

Room.belongsTo(User, {
  foreignKey: 'owner',
});

// create a models object and import all of our database tables
const models = {
  User,
  Room,
  RoomUsers,
  Message: sequelize.import('./message'),
  Vote: sequelize.import('./vote'),
};


// create relationships between all the tables that have associations
Object.keys(models).forEach((modelName) => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports.models = models;
module.exports.Op = Op;
module.exports.sequelize = sequelize;

