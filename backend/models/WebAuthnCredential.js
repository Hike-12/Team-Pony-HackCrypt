const mongoose = require('mongoose');

const webAuthnCredentialSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  credential_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  public_key: { 
    type: String, 
    required: true 
  },
  counter: { 
    type: Number, 
    default: 0 
  },
  device_type: { 
    type: String 
  },
  transports: [String],
  is_active: { 
    type: Boolean, 
    default: true 
  },
  enrolled_at: { 
    type: Date, 
    default: Date.now 
  },
  last_used: { 
    type: Date 
  }
});

webAuthnCredentialSchema.index({ student_id: 1 });
webAuthnCredentialSchema.index({ credential_id: 1 });

module.exports = mongoose.model('WebAuthnCredential', webAuthnCredentialSchema);