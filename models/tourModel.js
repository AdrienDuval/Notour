const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name '],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have a maximum  of 40 characters'],
    minlength: [10, 'A tour name must have more or equal than 10 characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tou must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tou must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    // enum for strings
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Ratings must be above 1.0'],
    max: [5, 'Ratings must be below 5.0']
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'a tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        // console.log(val)
        // this only points to current doc on new documents 
        return val.price < this.price;
      },
      message: 'Discount price ({VALUE}) should be below the regular price'
    }

  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'Tour must have a description'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  }
},

  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },

);

// DOCUMENT MIDDLEWARE: runs before the .save() and .create
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('will save documennt...');
//   next();
// })


// QUERY MIDDLEWARE

tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
})

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next()

})

// AGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  console.log(this.pipeline());
  next();
})

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
