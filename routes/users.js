const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");
require('dotenv').config();
const url=process.env.DB_URL;


mongoose.connect(url);

mongoose.connection.on('connected', () => {
  console.log('Connected..');
});


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
