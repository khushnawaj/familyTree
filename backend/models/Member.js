const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  dob: Date,
  dod: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  isLiving: { type: Boolean, default: true },
  bio: { type: String, trim: true, maxlength: 2000 },
  imageUrl: { type: String, trim: true },
  placeOfBirth: { type: String, trim: true },
  placeOfDeath: { type: String, trim: true },
  occupation: { type: String, trim: true },
  nodePosition: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  spouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  siblings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }]
}, { timestamps: true });

memberSchema.index({ userId: 1 });

module.exports = mongoose.model('Member', memberSchema);
