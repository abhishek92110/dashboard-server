const mongoose = require('mongoose');

async function dbConnect() {
    mongoose.connect('mongodb+srv://at604281:vKogs7XzOIGhcMgi@dashboarddb.ysw862b.mongodb.net/Student-Dashboard-dev')    //data base Name
    // mongoose.connect('mongodb://127.0.0.1:27017/Student-Dashbord')    //data base Name
        .then(() => console.log("MongoDB Connected"))
        .catch((err) => console.log("Mongo Error", err));
}
module.exports = dbConnect;