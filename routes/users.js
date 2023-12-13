const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/postgram");


const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  profileImage: String,
  bio : String,
  password : String,
  posts:[{
    type: mongoose.Schema.Types.ObjectId , 
    ref :"post",
   }]
});

userSchema.plugin(plm)
module.exports = mongoose.model("user", userSchema);