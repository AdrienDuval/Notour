const Tour = require('../models/tourModel');

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,summary,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFeilds()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that id', 404))
  }
  // tour.findOne({_id: req.params.id})
  res.status(200).json({
    status: 'success',
    result: tour.length,
    data: { tour },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {

  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tours: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that id', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
})

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that id', 404))
  }
  res.status(204).json({
    status: 'success',
    message: 'Product deleted succesfully',
    data: null,
  });
})

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        sumPrice: { $sum: '$price' },
        numTours: { $sum: 1 },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
}
);

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  console.log(new Date(`${year}-01-01`));
  const plan = await Tour.aggregate([
    {
      $addFields: {
        parsedStartDates: {
          $map: {
            input: '$startDates',
            as: 'date',
            in: {
              $dateFromString: {
                dateString: { $substr: ['$$date', 0, 10] }, // Extract 'YYYY-MM-DD'
                format: '%Y-%m-%d',
              },
            },
          },
        },
      },
    },
    // Unwind the new field 'parsedStartDates'
    {
      $unwind: '$parsedStartDates',
    },
    // Match documents where 'parsedStartDates' falls within the specified year
    {
      $match: {
        parsedStartDates: {
          $gte: new Date(Date.UTC(year, 0, 1)), // January 1 of the year
          $lte: new Date(Date.UTC(year, 11, 31)), // December 31 of the year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$parsedStartDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      },
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
    totalTours: plan.length,
  });
})
