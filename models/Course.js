const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({

  title: {
    type: String,
    trim: true,
    required: [true, 'Add a course title']
  },

  description: {
    type: String,
    required: [true, 'Add a description']
  },

  weeks: {
    type: String,
    required: [true, 'Add number of weeks']
  },

  tuition: {
    type: Number,
    required: [true, 'Add a tuition cost']
  },

  minimumSkill: {
    type: String,
    required: [true, 'Add minimum level of skill'],
    enum: ['beginner', 'intermediate', 'advanced']
  },

  scholarShipAvailable: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }

});


CourseSchema.statics.getAverageCost = async function(bootcampId){

  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' }
      }
    }
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId,{
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10
    })
  } catch (err) {
    console.log(err);
  }

}

// calc avg cost of a bootcamp after saving it's courses
CourseSchema.post('save', function () {
  this.constructor.getAverageCost(this.bootcamp)
});

// calc avg cost before remove
CourseSchema.pre('remove', function () {
  this.contructor.getAverageCost(this.bootcamp)
});





module.exports = mongoose.model('Course', CourseSchema);