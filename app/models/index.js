const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.tutorial = require("./tutorial.model")(mongoose);
db.meal = require("./meal.model");

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;