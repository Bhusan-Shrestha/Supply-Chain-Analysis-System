// Database configuration
// Uses SQLite by default (zero-setup, file-based) so the project runs
// out of the box for demo/evaluation purposes.
// To use PostgreSQL in production, set DB_DIALECT=postgres and the related
// DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME env vars in a .env file.

const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './scms.sqlite',
    logging: false
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'scms_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
      dialect,
      logging: false
    }
  );
}

module.exports = sequelize;
