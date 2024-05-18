const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    file:{
        type:String
     },
     LinkedinId:{
        type:String
     },
     Name: {
         type: String 
     },
     Number: {
         type: String 
     },
     Email: {
         type: String 
     }, 
     Password: {
         type: String 
     },  
     Headline: {
         type: String 
     },  
     code: {
         type: String 
     },  
     CompanyName: {
         type: String 
     },  
     Address: {
         type: String 
     },  
     bio: {
         type: String 
     },  
     url: {
         type: String
     },  
     date:{
         type: Date,
         default: Date.now
     },
     Course:{
         type:Object
     },
     mainCourse:{
         type:String
     },
     weekDaysBatch:{
         type:Object
     },
     WeekEndBatch:{
         type:Object
     }



});

const uploads = new mongoose.model("trainers", userSchema);


module.exports = uploads;