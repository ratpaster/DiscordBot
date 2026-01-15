const SQL = require('sequelize');
const sql = require('../utils/database');

const Guild = sql.define('guild', {
    id: {
        type: SQL.STRING,
        primaryKey: true
    },
    welcomeChannelId: {
        type: SQL.STRING,
        allowNull: true
    },
    welcomeChannelRole: {
        type: SQL.STRING,
        allowNull: true
    }
});

module.exports = Guild;