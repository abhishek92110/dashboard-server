const express = require("express");
const app = express();
const dbConnect = require("./db/conn");
const users = require("./models/userSchema");
const cors = require("cors");
const router = require("./routes/router");
const bodyParser = require('body-parser');


dbConnect()



app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));



app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.json("server start")
})

global.__basedir = __dirname;


// app.use(cors(corsOptions));
const port = process.env.PORT || 8000;

const initRoutes = require("./routes/index");

app.use(express.urlencoded({ extended: true }));
initRoutes(app);

app.use(router);

 console.log("app js running")
app.listen(port, (res) => {
    console.log(`App Listening on port ${port}`)
})