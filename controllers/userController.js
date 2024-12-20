const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel')


exports.getAllUsers = catchAsync(async (req, res, next) => {
  const user = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};
exports.createUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};
exports.updateUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};
exports.deleteUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "This route is not yet defined" });
};
