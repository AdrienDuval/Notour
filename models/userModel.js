const mongoose = require('mongoose');
const validator = require('validator');
const { validate } = require('./tourModel');
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
    }

})

userSchema.pre('save', async function (next) {
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

const User = mongoose.model('User', userSchema);

module.exports = User;