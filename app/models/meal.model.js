const mongoose = require("mongoose");

const Meal = mongoose.model(
  "Meal",
  new mongoose.Schema({
    title: String,
    description: String,
    calories: Number,
    dateTimeOfMeal:Date,
    fileUrl:String,
    fileName:String,
    user:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
  }).method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    object.user.id = object.user._id;
    return object;
  })
);

module.exports = Meal;
