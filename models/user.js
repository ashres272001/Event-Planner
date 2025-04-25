module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            hasAtAndDotCom(value) {
              if (!value.includes('@') || !value.endsWith('.com')) {
                throw new Error('Email must contain "@" and end with ".com"');
              }
            }
          }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [8]
        }
      },
      role: {
        type: DataTypes.ENUM('Organizer', 'Attendee'),
        allowNull: false
      }
    });
  };
  