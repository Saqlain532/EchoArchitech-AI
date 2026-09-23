import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Staff Architect',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Do not return password by default
    },
    initials: {
      type: String,
      default: 'SA',
      trim: true,
    },
    role: {
      type: String,
      default: 'Lead Cloud Architect',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    github: {
      username: {
        type: String,
        default: '',
        trim: true,
      },
      connected: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
UserSchema.pre('save', async function (next) {
  // Auto-generate initials from name
  if (this.isModified('name') && this.name) {
    const parts = this.name.trim().split(' ').filter(Boolean);
    this.initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : this.name.substring(0, 2).toUpperCase();
  }

  // Hash password if modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);
