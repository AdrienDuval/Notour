const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

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
        passwordConfirm: req.body.passwordConfirm,
        passwordChangeAt: req.body.passwordChangeAt,
        role: req.body.role,
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

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1) get the token given by the user and check if it exists 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // console.log(token);

    if (!token) {
        return next(new AppError('You are not login! please login to get access.', 401));
    }

    // 2) verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 4) check if user still exists 
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(new AppError('the user belonging to this token does not longer exists', 401))
    }

    // 4) check if user changed password after the token was issued 

    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed passowrd!, Please login again', 401))
    }

    // Grnad acces
    req.user = currentUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide'] . user.role
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on POST email

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }

    //2 Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) send it to to user's emails
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfir to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'your password reset token, valid for 10min',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })


    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
            status: 'fail',
            message: err
        })

    }


})
exports.resetPassword = (req, res, next) => { }