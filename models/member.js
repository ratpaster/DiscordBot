const SQL = require('sequelize');
const sql = require('../utils/database');

const Member = sql.define('member', {
    id: {
        type: SQL.STRING,
        primaryKey: true
    },
    guildId: {
        type: SQL.STRING,
        primaryKey: true
    }
});

module.exports = Member;