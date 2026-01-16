const SQL = require('sequelize');
const sql = require('../utils/database');

const BlackjackGame = sql.define('blackjackGame', {
    userId: {
        type: SQL.STRING,
        primaryKey: true
    },
    guildId: {
        type: SQL.STRING,
        primaryKey: true
    },
    betAmount: {
        type: SQL.INTEGER,
        allowNull: false
    },
    playerHand: {
        type: SQL.JSON,
        allowNull: false,
        defaultValue: []
    },
    dealerHand: {
        type: SQL.JSON,
        allowNull: false,
        defaultValue: []
    },
    deck: {
        type: SQL.JSON,
        allowNull: false,
        defaultValue: []
    },
    status: {
        type: SQL.STRING,
        allowNull: false,
        defaultValue: 'active'
    },
    messageId: {
        type: SQL.STRING,
        allowNull: true
    },
    canDoubleDown: {
        type: SQL.BOOLEAN,
        defaultValue: true
    }
});

module.exports = BlackjackGame;