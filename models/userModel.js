const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
// const { validate } = require('./tourModel');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name']
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        Enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minLength: 8,
        select: false,
    },

    passwordConfirm: {
        type: String,
        required: [false, 'A user must have a password Confirm'],
        validate: {
            // THis only works on SAVE or Create
            validator: function (el) {
                return el === this.password
            },
            message: 'passwords are not the sames '

        }
    },

    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
})

userSchema.pre('save', async function (next) {
    console.log(this.passwordChangeAt);
    // Check if the password was modified
    if (!this.isModified('password')) return next();
    // bcrpt hasing algorithm to prevent from brute for attacks
    this.password = await bcrypt.hash(this.password, 12);

    //Delete the password confirm field 
    this.passwordConfirm = undefined;
    next();
})

// instance method
// function to compare password 
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);

}

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangeAt) {
        const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10);
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    console.log({ resetToken }, this.passwordResetToken);
    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;