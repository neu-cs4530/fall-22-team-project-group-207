const mongoose = require('mongoose');
const schema = require('./schema');

const model = mongoose.model('LeaderboardModel', schema);
module.exports = model;
