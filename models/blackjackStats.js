const SQL = require('sequelize');
const sql = require('../utils/database');

const BlackjackStats = sql.define('blackjackStats', {
    userId: {
        type: SQL.STRING,
        primaryKey: true
    },
    guildId: {
        type: SQL.STRING,
        primaryKey: true
    },
    gamesPlayed: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    gamesWon: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    gamesLost: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    gamesPushed: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    totalWinnings: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    totalLosses: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    biggestWin: {
        type: SQL.INTEGER,
        defaultValue: 0
    },
    blackjacks: {
        type: SQL.INTEGER,
        defaultValue: 0
    }
});

module.exports = BlackjackStats;