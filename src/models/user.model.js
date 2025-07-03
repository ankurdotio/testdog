import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Not required if using Google auth
      unique: true,
      sparse: true, // Allow multiple null values (for Google users without username)
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: function () {
        return Boolean(this.googleId); // Email verification not required for Google users
      },
      select: false, // Don't return this field by default
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Not required if using Google auth
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      select: false,
    },
    avatar: {
      type: String,
      default: 'default.jpg',
    },
    forgotPasswordToken: {
      type: String,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  // Ensure googleId is never explicitly null
  if (this.googleId === null) {
    this.googleId = undefined;
  }

  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
