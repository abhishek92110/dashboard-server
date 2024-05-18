const mongoose = require("mongoose");

const CounselorSchema = new mongoose.Schema({


    Name: {
        type: String,

    },
    Number: {
        type: String,

    },
    Email: {
        type: String,


    },
    password: {
        type: String,


    },
    Address: {
        type: String,

    },

    file: {
        type: String,

    },
    counselorNo: {
        type: String,

    },
    url: {
        type: String,

    }

});

const counselors = new mongoose.model("counselors", CounselorSchema);


module.exports = counselors;