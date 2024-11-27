const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {

    // removing this because it takes all the informations set up in the request body so basically anyone can set himself as and admin and login into the application or ser wather ever the want tot the body which is a huge seccurity issue
    // const newUser = await User.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});