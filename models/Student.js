const mongoose = require('mongoose');



const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[A-Za-z0-9]+$/.test(v);
      },
      message: props => `${props.value} is not a valid registration number!`
    }
  },
  year: { 
    type: String, 
    required: true,
    enum: ['1st', '2nd', '3rd', '4th']
  },
  department: { type: String, required: true },
  gender: { 
    type: String, 
    required: true,
    enum: ['Male', 'Female']
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  registeredAt: { type: Date, default: Date.now }
});

// Create index for faster queries
studentSchema.index({ registerNumber: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);

