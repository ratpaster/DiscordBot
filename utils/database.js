const SQL = require('sequelize');

const sql = new SQL('database', 'firebobb', 'moribundem', {
    dialect: 'sqlite',
    host: 'localhost',

    storage: 'database.sqlite',
    logging: false
});


module.exports = sql;