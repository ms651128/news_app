const mongoose = require('mongoose')
const {Schema} = mongoose;
const userSchema = new Schema({
    username: String,
    email: {type:String , required:true},
    password : {type:String, required:true},
    images : [String],
    topics: {
      type: [String], 
      required: true,
    },
    savedArticles: [{
      title: String,
      description: String,
      url: String,
      urlToImage: String,
    }],
  });

exports.users = mongoose.model('user', userSchema);