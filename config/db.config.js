const db = require('./db');

// Exporter la version promise du pool pour être compatible avec les controllers
module.exports = db.promise();
