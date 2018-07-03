require('dotenv').config();

const Sequelize = require('sequelize');

const { Op } = Sequelize;

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    operatorsAliases: false,
    logging: false,
  });
} else {

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: 'localhost',
      dialect: 'postgres',
      operatorsAliases: false,
      logging: false,
    },
  );
}

// DEPLOYMENT
// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   operatorsAliases: false,
//   logging: false,
// });

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
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
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
  lifetime_score: {
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
  scores: {
    type: Sequelize.STRING,
    allowNull: true,
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
// ────────────────────────────────────────────────────────────────────────────────


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

