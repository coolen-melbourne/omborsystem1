const mongoose = require('mongoose');

const rowSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },  // "A", "B", ...
  shelves: { type: Number, default: 20 },                 // nechta polka
  levelsPerShelf: { type: Number, default: 2 }            // har polkada necha qavat
});

module.exports = mongoose.model('Row', rowSchema);