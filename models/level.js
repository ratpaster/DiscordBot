const SQL = require('sequelize');
const sql = require('../utils/database');

const Level = sql.define('level', {
    userId: {
        type: SQL.STRING,
        primaryKey: true
    },
    guildId: {
        type: SQL.STRING,
        primaryKey: true
    },
    xp: {
        type: SQL.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    level: {
        type: SQL.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    messageCount: {
        type: SQL.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    lastMessageTimestamp: {
        type: SQL.BIGINT,
        defaultValue: 0,
        allowNull: false
    }
});

module.exports = Level;