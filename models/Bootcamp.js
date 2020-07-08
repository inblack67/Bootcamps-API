const mognoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');
require('colors');

const BootcampSchema = mognoose.Schema({

  name: {
    type: String,
    required: [true, 'Enter a name please'],
    unique: true,
    trim: true,
    maxLength: [50, 'Name cannot be more than 50 chars']
  },

  slug: String,        

  description: {
    type: String,
    required: [true, 'Enter a description please'],
    maxLength: [500, 'Description cannot be more than 500 chars']
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  phone: {
    type: String,
    maxLength: [20,'Phone cannot be more than 50 chars']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },

  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  careers: {
    // Array of strings
    type: [String],
    required: true,
    enum: [
      'Web Development',
      'Mobile Development',
      'UI/UX',
      'Data Science',
      'Business',
      'Other'
    ]
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating must can not be more than 10']
  },
  averageCost: Number,
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  housing: {
    type: Boolean,
    default: false
  },
  jobAssistance: {
    type: Boolean,
    default: false
  },
  jobGuarantee: {
    type: Boolean,
    default: false
  },
  acceptGi: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mognoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }

}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// slug
BootcampSchema.pre('save', function(next){

  // devcentral-bootcamp
  this.slug =  slugify(this.name, { lower: true });
  next();
});

// geocode
BootcampSchema.pre('save', async function(next) {

  const loc = await geocoder.geocode(this.address);

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].street,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  }

  // stopping address to get saved in db as we already have formatted add
  this.address = undefined;

  next();
})

// cascade delete
BootcampSchema.pre('remove', async function (next) {

  console.log(`Courses being deleted from bootcamp with id ${this._id}`.red.bold);

  await this.model('Course').deleteMany({ bootcamp: this._id });

  next();
})


// reverse populate with virtuals
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false
});


module.exports = mognoose.model('Bootcamp',BootcampSchema);