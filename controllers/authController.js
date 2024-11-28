const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const { json } = require('express');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.jwt_expires_IN,
    });
}
exports.signup = catchAsync(async (req, res, next) => {

    // removing this because it takes all the informations set up in the request body so basically anyone can set himself as and admin and login into the application or ser wather ever the want tot the body which is a huge seccurity issue
    // const newUser = await User.create(req.body);

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //1) check if email and password exists 

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }
    //2) check if the user exists && password is correct 
    // Explicitly select the password that has been hidden in the database
    const user = await User.findOne({ email: email }).select('+password');


    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('incorrect email or password', 401))
    }

    console.log(user);

    // 3) if everything is okay send the token to the client

    console.log("token", user._id)
    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token
    });
})