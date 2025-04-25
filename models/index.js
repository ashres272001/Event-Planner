const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db.sqlite')
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, DataTypes);
db.Event = require('./event')(sequelize, DataTypes);
db.RSVP = require('./rsvp')(sequelize, DataTypes);

// Associations
db.User.hasMany(db.Event, { foreignKey: 'createdBy' });
db.Event.belongsTo(db.User, { foreignKey: 'createdBy' });

db.User.belongsToMany(db.Event, {
    through: db.RSVP,
    foreignKey: 'userId',
    as: 'RsvpedEvents'
  });
  
db.Event.belongsToMany(db.User, {
    through: db.RSVP,
    foreignKey: 'eventId',
    as: 'Attendees'
  });

module.exports = db;