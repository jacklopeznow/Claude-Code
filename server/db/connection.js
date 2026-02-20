const { initializeDatabase } = require('./init');

let dbInstance = null;

function getConnection() {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

function closeConnection() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getConnection,
  closeConnection
};
