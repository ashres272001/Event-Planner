module.exports = (sequelize, DataTypes) => {
    return sequelize.define('RSVP', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  };
  