const mongoose = require('mongoose');

const giftedSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  giftedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GiftedStudent', giftedSchema);
