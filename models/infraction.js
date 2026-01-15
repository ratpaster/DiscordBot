const SQL = require('sequelize');
const sql = require('../utils/database');

const Infraction = sql.define('infraction', {
    id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    guildId: {
        type: SQL.STRING,
        allowNull: true
    },
    reason: {
        type: SQL.STRING,
        allowNull: true,
        defaultValue: "No reason provided"
    },
    enforcerId: {
        type: SQL.STRING,
        allowNull: false
    },
    type: {
        type: SQL.STRING,
        allowNull: false
    },
    duration: {
        type: SQL.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Infraction;