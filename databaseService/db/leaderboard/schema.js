const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: String,
    wins: Number,
  },
  { collection: 'leaderboard' },
);
module.exports = schema;
