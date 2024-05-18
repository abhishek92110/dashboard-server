const express = require("express");
const mongoose = require('mongoose')
const router = express.Router();
const app = express();
const uploadFile = require("../middleware/upload");
const controller = require("../controller/file.controller");
const users = require("../models/userSchema");
const oldStudent = require("../models/OldStudent");
const oldCounselor = require("../models/OldCounselor")
const document = require("../models/Document");
const uploads = require("../models/teachermodal");
const oldtrainer = require("../models/OldTrainer");
const StudentFee = require("../models/FeeSchema");
const uploaditem = require("../models/UploadedItem");
const submititem = require("../models/Submitteditem");
const messagemodel = require("../models/Messagemodel");
const Studentmessagemodel = require("../models/StudentMessage");
const runningBatches = require("../models/RunningBatch");
const deletedBatches = require("../models/DeletedBatch");
const FixDemo = require("../models/FixDemo");
const NewDemo = require("../models/DemoList");
const DemoStudent = require("../models/DemoStudent");
const inst = require("../models/inst");
const DataModel = require('../models/filterdata');
const multer = require("multer");
const bodyParser = require('body-parser');
var jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const fs = require("fs");
const path = require('path');
const baseUrl = "http://localhost:8000/files/";
const sendmail = require('../controller/sendmail');
const resetpassword = require("../controller/resetpassword");
const admins = require("../models/Admin")
const attendance = require("../models/Attendance")
const Studentattendance = require("../models/StudentAttendance")
const compiler = require('compilex');
const batches = require("../models/BatchCourse");
const subCourse = require("../models/Subcourse");
const runningBatch = require("../models/RunningBatch");
const registerStudent = require("../models/RegisteredStudent");
const counselors = require("../models/Counselor")
// const uploadfiles = require('../models/UploadedItem')
const uploadclassurl = require('../models/UploadClassUrl')
const uploadvideourl = require('../models/VideoUrl')
const Notes = require('../models/Notes')
const options = { stats: true }
compiler.init(options)

const jwt_secret = "uuu"

// add Student route

router.post("/register", controller.upload, async (req, res) => {
    // console.log('url =',req.body,req.url,req.file) 
    console.log('register route',req.body)   

    const lastStudent = await users
    .findOne({}, {}, { sort: { _id: -1 } }) // Sort by the default ObjectId in descending order
    .exec();

    let newEnrollment = generateEnrollment(lastStudent,req.body);
    
    req.body.EnrollmentNo = newEnrollment

    sendmail(req, res)
    req.body.url = req.url
    req.body.file = req.file
    req.body.CollectionDate = []

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
    const day = String(currentDate.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    let tempRemark = [{
        "date": formattedDate,
        "message": req.body.Remark
    }]

    req.body.Remark = tempRemark

    if (req.body.remainingFees <= 0) {
        req.body.feesStatus = "Fees Completed"
    }
    else {
        req.body.feesStatus = "Fees Incompleted"
    }

    const batchStartDate = new Date(req.body.BatchStartDate); // Assuming BatchStartDate is in a valid date format (e.g., 'YYYY-MM-DD')
    batchStartDate.setDate(batchStartDate.getDate() + 3); // Add 3 days

    if (batchStartDate.getDate() <= 3) {

        batchStartDate.setMonth(batchStartDate.getMonth());
        batchStartDate.setDate(3);
    }

    const dueDate = `${batchStartDate.getFullYear()}-${String(batchStartDate.getMonth() + 1).padStart(2, '0')}-${String(batchStartDate.getDate()).padStart(2, '0')}`;

    const inputDate = new Date(dueDate);
    let dueDate2 = new Date(inputDate);
    let dueDate3 = new Date(inputDate);
    let dueDate4 = new Date(inputDate);

// Increase one month
dueDate2.setMonth(inputDate.getMonth() + 1);
dueDate3.setMonth(inputDate.getMonth() + 2);
dueDate4.setMonth(inputDate.getMonth() + 3);

// Decrease 3 days
dueDate2.setDate(inputDate.getDate() - 3);
dueDate3.setDate(inputDate.getDate() - 3);
dueDate4.setDate(inputDate.getDate() - 3);

dueDate2 = dueDate2.toISOString().split('T')[0]
dueDate3 = dueDate3.toISOString().split('T')[0]
dueDate4 = dueDate4.toISOString().split('T')[0]

req.body.totalInstallment = 4

    let totalFees = parseInt(req.body.Fees)-parseInt(req.body.RegistrationFees)
    let inst =  Math.round(totalFees/req.body.totalInstallment)
    console.log('installment first = ',inst,req.body.totalInstallment)
    let inst2 = Math.round(inst*2)
    let inst3 = Math.round(inst*3)
    let inst4 = Math.round(inst*4)

    let instDate = {}    

    for(let i=1; i<=(req.body.totalInstallment);i++){
        if(i===1){
            instDate[inst]=dueDate
            console.log('installment first and if  = ',inst,instDate)
        }

        if(i===2){
            console.log('installment second and if 2 before= ',inst2,instDate)
           instDate[inst2]=dueDate2
         console.log('installment second and if 2 after= ',inst2,instDate)
        }

        if(i===3){
            console.log('installment third and if 3 before= ',inst3,instDate)
            instDate[inst3]=dueDate3
          console.log('installment third and if 3 after= ',inst3,instDate)
        }
        if(i===4){
            console.log('installment fourth and if 4 before= ',inst4,instDate)
            instDate[inst4]=dueDate4
          console.log('installment fourth and if 4 after= ',inst4,instDate)
        }
       
    }

    
   

    req.body.DueDate = dueDate;
    req.body.InstallmentDate = instDate;
    console.log('installment due date  = ',instDate)
    req.body.paidFees = req.body.RegistrationFees;
    req.body.Installment = inst;
    req.body.minimumFees = inst;
    req.body.paymentStatus = "newAdmission"
    req.body.studentRunningBatch = [req.body.Batch]
    req.body.AllTrainer = [req.body.TrainerName]
    req.body.AllTrainerId = [req.body.TrainerID]
    req.body.courseRunningStatus = "active"

    // console.log("req body =", req.body)
    try {
        const newUser = new users(req.body);

        const savedUser = await newUser.save();
        const updateRegistration = await registerStudent.updateOne({RegistrationNo:req.body.RegistrationNo},{$set:{status:"Added"}})
        res.status(200).json(savedUser);
        // sendmail(req, res)
    } catch (error) {
        console.log("error of register student",error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});


//function to generate enrollment 

const generateEnrollment = (student, data)=>{
    console.log('generate enrollment =', data)
    let course = '';
    let splitCourse = data.Course.split(' ')
    if (splitCourse.length > 1) {
        splitCourse.map(data => {
            course = `${course}${data[0]}`
        })
    }

    else {
        course = splitCourse[0]
    }
    let newEnrollment;
    let year = data.BatchStartDate.split('-')[0]
    let month = data.BatchStartDate.split('-')[1]
    if(student){
            
    let count = parseInt(student.EnrollmentNo.split('/')[2].split('-')[1]);
    count = count+1
    count = count.toString().padStart(2, '0')
    
    newEnrollment = `UC${year}/${course}/${month}-${count}`
    console.log('enrollment no =',newEnrollment)

        }
        else{
            newEnrollment = `UC${year}/${course}/${month}-01`
        }

    return newEnrollment
}

// function to generate counselor Enrollment

const generateCounselorNo = (counselor)=>{

    
    let newEnrollment;
    let year = new Date().getFullYear()
    let month =  (new Date().getMonth()+1)
    month = month<10?`0${month}`:month

    if(counselor){
            
    let count = parseInt(counselor.counselorNo.split('/')[1].split('-')[1]);
    count = count+1
    count = count.toString().padStart(2, '0')
    
    newEnrollment = `UC${year}/${month}-${count}`
    console.log('enrollment no =',newEnrollment)

        }
        else{
            newEnrollment = `UC${year}/${month}-01`
        }

    return newEnrollment
}

router.get('/getlastData',async(req,res)=>{
    const lastStudent = await users
    .findOne({}, {}, { sort: { _id: -1 } }) // Sort by the default ObjectId in descending order
    .exec();
    console.log('last student',lastStudent)
})

// total fees route

router.get('/getTotalFees',async(req,res)=>{
    let totalFees = await StudentFee.find();

    let totalAmount = 0;

    totalFees.map(data=>{
        totalAmount = totalAmount + parseInt(data.amount)
    })
    console.log('total fees =',totalAmount)
    const formattedFees = formatRupees(totalAmount);
    const feesInWords = convertToWords(totalAmount);

    // console.log(`Formatted Amount (Rupees): ₹${formattedFees}`);
    // console.log(`Amount in English Words: ${feesInWords}`);

    res.send({"formattedFees":formattedFees,"feesInWords":feesInWords})
})

// get counselor total fees router
router.get('/getCounselorTotalFees',async(req,res)=>{
    const id  = req.header("id")
    let totalFees = await StudentFee.find({CounselorId:id});    

    let totalAmount = 0;

    totalFees.map(data=>{
        totalAmount = totalAmount + parseInt(data.amount)
    })
    // console.log('total fees =',totalAmount)
    const formattedFees = formatRupees(totalAmount);
    const feesInWords = convertToWords(totalAmount);

    // console.log(`Formatted Amount (Rupees): ₹${formattedFees}`);
    // console.log(`Amount in English Words: ${feesInWords}`);

    res.send({"formattedFees":formattedFees,"feesInWords":feesInWords,"totalFeesData":totalFees})
})

// get counselor new fees router 

router.get('/getCounselorNewTotalFees/:id',async(req,res)=>{
   
    const month = req.header("month")
    const id = req.header("id")
    let totalFees = await StudentFee.find({CounselorId:id,month:month});    

    let totalAmount = 0;

    totalFees.map(data=>{
        totalAmount = totalAmount + parseInt(data.amount)
    })
    console.log('total fees =',totalAmount) 
    const formattedFees = formatRupees(totalAmount);
    const feesInWords = convertToWords(totalAmount);

    console.log(`Formatted Amount (Rupees): ₹${formattedFees}`);
    console.log(`Amount in English Words: ${feesInWords}`);

    res.send({"formattedFees":formattedFees,"feesInWords":feesInWords,"totalFeesData":totalFees})
})

// get all sub course and main course router

router.get('/allSubMainCourse',async(req,res)=>{  
    
    // console.log("all sub main course func =")
    let allCourse = await subCourse.find()

    let courses =[]
    allCourse.map(data=>{

        data.subCourse.map(element=>{
            courses.push(element)
        })
    
    })
    let maincourses =[]

    allCourse.map(data=>{
            maincourses.push(data.mainCourse)       
    
    })
        res.send({courses:courses,mainCourse:maincourses,allCourse:allCourse})
})

router.get('/getMonthFees',async(req,res)=>{
    const month = req.header("month")
    let totalFees = await StudentFee.find({month:month});

    console.log('total fees =',totalFees)
    res.send(totalFees)

    let totalAmount = 0;

    totalFees.map(data=>{
        totalAmount = totalAmount + parseInt(data.amount)
    })
    // console.log('total fees =',totalAmount)
    const formattedFees = formatRupees(totalAmount);
    const feesInWords = convertToWords(totalAmount);

    // console.log(`Formatted Amount (Rupees): ₹${formattedFees}`);
    // console.log(`Amount in English Words: ${feesInWords}`);

    // res.send({"formattedFees":formattedFees,"feesInWords":feesInWords})
})

// convert amount to rupees and in words


function formatRupees(amount) {
    // Function to convert a number to the Indian numbering system (with commas)
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

function convertToWords(amount) {
    // Function to convert a number to English words
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    
    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];
  
    function convertToWordsRecursive(number) {
      if (number < 20) {
        return ones[number];
      } else if (number < 100) {
        return tens[Math.floor(number / 10)] + ' ' + ones[number % 10];
      } else if (number < 1000) {
        return ones[Math.floor(number / 100)] + ' Hundred ' + convertToWordsRecursive(number % 100);
      } else if (number < 100000) {
        return convertToWordsRecursive(Math.floor(number / 1000)) + ' Thousand ' + convertToWordsRecursive(number % 1000);
      } else if (number < 10000000) {
        return convertToWordsRecursive(Math.floor(number / 100000)) + ' Lakh ' + convertToWordsRecursive(number % 100000);
      } else {
        return 'Number too large to convert';
      }
    }
  
    return convertToWordsRecursive(amount);
  }
  
  

  router.get("/getTotalFeeschart", async (req, res) => {
    try {
        const userdata = await StudentFee.find()
        res.status(200).json(userdata);
    } catch (error) {
        res.status(500).json(error);
    }
});
  



// get userdata
router.get("/getdata", async (req, res) => {
    try {
        const userdata = await users.find({courseRunningStatus:"active"}).select("-password");
        // // console.log('user data =',userdata)
        res.status(200).json(userdata);
    } catch (error) {
        // console.log('error =', error.message)
        res.status(500).json(error);
    }
});

// route to get running Student
router.get("/getAllStudent", async (req, res) => {

    let allStudent = await users.find({courseRunningStatus:"active"})
    
    console.log('total Student =', allStudent.length)
    res.send({ "totalStudent": allStudent.length })
})

const checkRunningBatchStudent = (batch, runningBatch) => {
    let StudentStatus = false
    runningBatch.map(data => {
        if (data.Batch == batch) {
            StudentStatus = true
        }
    })

    return StudentStatus
}

// route to get student of current month

router.get('/getNewStudent/:currentMonth',async(req,res)=>{
  
    const {currentMonth} = req.params
    let allStudent = await users.find({courseRunningStatus:"active"})

    let newStudent = 0
    allStudent.map(data=>{
        // console.log("data =",data.BatchStartDate, data._id)
        let month = (data.BatchStartDate.split('-'))[1]

        if(month == currentMonth){
            newStudent = newStudent+1
        }
    })
    // console.log('new Student =',newStudent)
    res.send({"newStudent":newStudent})
})


// route get trainer new student

router.get('/getNewTrainerStudent',async(req,res)=>{
    let currentMonth = req.header("month")
    const id  = req.header("id")
    console.log("trainer id =",currentMonth,id)
    
    let allStudent = await users.find({TrainerID:id, courseRunningStatus:"active"})

    let newStudent = []

    allStudent.map(data=>{
        // console.log("data =",data.BatchStartDate, data._id)
        let month = (data.BatchStartDate.split('-'))[1]

        if(month == currentMonth){
           newStudent.push(data)
        }
    })
    // console.log('new Student =',newStudent)
    res.send({"newStudent":newStudent})
})


// field from value function
function getFieldFromValue(obj, value) {
    for (const key in obj) {
        if (obj[key] === value) {
            return key;
        }
    }
    return null; // Return null if the value is not found in the object
}

// get student month fees status

router.get('/getStudentFeesStatus',async(req,res)=>{

    
    let allStudent = await users.find({})

    let current = new Date();

    for (let index = 0; index < allStudent.length; index++) {
      
      let due = new Date(allStudent[index].DueDate);
      console.log('condition of due and current =',due,current,current>(new Date(due)) )
    //   console.log("current and due =",current>(new Date(due)),current,due)
      const lastCollectionDate = new Date(allStudent[index].lastCollectionDate);

      const currentDateDiff = Math.floor((due - current) / (1000 * 60 * 60 * 24));
      console.log('date diff =',currentDateDiff)
    //   const currentDateMonth = current.getMonth();
    //   const currentDateYear = current.getFullYear();
    //   const currentDate =   current.getDate();
    //   const dueDateMonth = due.getMonth();
    //   const dueDateYear = due.getFullYear();
    //   const dueDate = due.getDate()
    //   const lastCollectionDateMonth = lastCollectionDate.getMonth();

      if(allStudent[index].DueDate!=="Fees Completed")
      {
  
        if (currentDateDiff >= 0 && currentDateDiff <= 2)
         {
           
            const installmentFees = getFieldFromValue(allStudent[index].InstallmentDate, allStudent[index].DueDate);
    
            console.log('installment fees =',installmentFees)
            if(installmentFees>allStudent[index].paidFees)
            {
                // console.log("Payment notification");
                let paymentStatus = await updatePaymentStatus("notification", allStudent[index]._id);
                console.log("Payment status =", paymentStatus);
            }   
            else if(installmentFees<allStudent[index].paidFees)
            {
                // console.log("Payment paid");
                let paymentStatus = await updatePaymentStatus("paid", allStudent[index]._id);
                console.log("Payment status =", paymentStatus);
            } 
         
               
          }

          else if (current>(new Date(due))) {

            const installmentFees = getFieldFromValue(allStudent[index].InstallmentDate, allStudent[index].DueDate);
            console.log("current date is greater")
    
              
            if(installmentFees>allStudent[index].paidFees)
            {
                // console.log("Payment pending");
                let paymentStatus = await updatePaymentStatus("pending", allStudent[index]._id);
                console.log("Payment status =", paymentStatus);
            }   
            else if(installmentFees<allStudent[index].paidFees)
            {
                // console.log("Payment paid");
                let paymentStatus = await updatePaymentStatus("paid", allStudent[index]._id);
                console.log("Payment status =", paymentStatus);
            } 
            
          }
        }

    
      
    };

    res.send({"status":"done"})

})

// update payment status

const updatePaymentStatus = async (status, id) => {
    console.log('update payment')
    let paymentStatus = await users.updateOne({ _id: id }, { $set: { paymentStatus: status } }, { upsert: true })

  }

router.get('/getNewCounselorStudent',async(req,res)=>{
    console.log("new counselor student")
    let currentMonth = req.header("month")
    let id = req.header("id")
    // console.log("id =",currentMonth,id)
    console.log("month =",currentMonth)
    
    let allStudent = await users.find({CounselorID:id,courseRunningStatus:"active"})

    let newStudent = []

    allStudent.map(data=>{
        // console.log("data =",data.BatchStartDate, data._id)
        let month = (data.BatchStartDate.split('-'))[1]
        
        if(month == currentMonth){
           newStudent.push(data)
        }
    })
    // console.log('new Student =',newStudent)
    res.send({"newStudent":newStudent})
})


// register student

router.post("/updateRegisterStudent/:id", async (req, res) => {
    const {id} = req.params
    console.log("register route =", req.body)

    try {
        const savedUser = await registerStudent.findByIdAndUpdate(id,req.body,{
            new:true
        });
        res.status(200).json(savedUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

router.post("/registerStudent", async (req, res) => {
    console.log("register route =", req.body)

    const lastStudent = await registerStudent
    .findOne({}, {}, { sort: { _id: -1 } }) // Sort by the default ObjectId in descending order
    .exec();

    let newRegistration;
    console.log('last student =',lastStudent)

    if (lastStudent && lastStudent.RegistrationNo) {
      const lastStudentEnrollment = lastStudent.RegistrationNo;
      const currentYear = new Date().getFullYear();
      
      // Check if the last enrollment number belongs to the current year
      if (lastStudentEnrollment.startsWith(`Reg${currentYear.toString()}`)) {
        const lastEnrollmentNumber = parseInt(lastStudentEnrollment.substr(7), 10);
        const nextEnrollmentNumber = lastEnrollmentNumber + 1;
        
         newRegistration = `Reg${currentYear}${nextEnrollmentNumber.toString().padStart(2, '0')}`;
        console.log(newRegistration);
      } else {
        // Start a new enrollment for the current year
         newRegistration = `Reg${currentYear}01`; // Assuming it starts from 01
        console.log(newRegistration);
      }
    } else {
      // If there are no previous enrollments, start a new one for the current year
      const currentYear = new Date().getFullYear();
       newRegistration = `Reg${currentYear}01`; // Assuming it starts from 01
      console.log(newRegistration);
    }

    req.body.RegistrationNo = newRegistration


    try {
        const savedUser = await registerStudent.create(req.body);
        res.status(200).json(savedUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// get counselor registtartion router
router.get('/getCounselorRegisterStudent',async(req,res)=>{
    const id  = req.header("id")   

    try {
        const userdata = await registerStudent.find({CounselorId:id});
        // console.log("user data =",userdata)
        res.status(200).json(userdata);
        
    } catch (error) {
        console.log('error =', error.message)
        res.status(500).json(error);
    }
})

// get counselor new registration router


router.get('/getCounselorNewRegisterStudent/:id',async(req,res)=>{
     
    const month = req.header('month')
    const id = req.header('id')

    try {
        const userdata = await registerStudent.find({CounselorId:id});
        // console.log("user data =",userdata)

        let newRegisterCousnelor = userdata.filter(data=>{
            let matchMonth = data.RegistrationDate.split('-')[1]

          return matchMonth===month
        })
        res.status(200).json(newRegisterCousnelor);
        
    } catch (error) {
        console.log('error =', error.message)
        res.status(500).json(error);
    }
})

//Get resister student

router.get("/getregisterStudent", async (req, res) => {
    try {
        const userdata = await registerStudent.find();
        res.status(200).json(userdata);
    } catch (error) {
        console.log('error =', error.message)
        res.status(500).json(error);
    }
});

router.post("/getStudentByCounselor", async (req, res) => {
    console.log("get student counselor route =", req.body)
    try {

        const userdata = await users.find(req.body);

        
        console.log("get counselor student =", userdata)
        res.status(200).json(userdata);

    } 
    catch (error) {
        res.status(500).json(error);
    }
})

router.get("/getStudentByCounselor/:id", async (req, res) => {
    const {id} = req.params
 
    try {
        const userdata = await users.find({CounselorID:id,courseRunningStatus:"active"});
        res.status(200).json(userdata);
    } catch (error) {
        res.status(500).json(error);
    }
})

router.get("/scan", async (req, res) => {
    const directoryPath = __basedir + "/uploads/";

    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            res.status(500).send({
                message: "Unable to scan files!",
            });
        }

        let fileInfos = [];

        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            const date = stats.mtime;
            fileInfos.push({
                file: file, // Change "name" to "file"
                url: baseUrl + file,
            });
        });

        res.status(200).send(fileInfos);
    });
});
// get individual user
router.get("/getuser/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const userindividual = await users.findById(id);
        // // console.log("user individual =", userindividual);
        res.send({ "status": "active", "userIndividual": userindividual });
    } catch (error) {
        res.status(500).json(error);
    }
});

// update user data
// router.post("/updateuser/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         // // console.log('req.body.user =', req.body)
//         const updateduser = await users.findByIdAndUpdate(id, req.body, {
//             new: true
//         });

//         // // console.log(updateduser);
//         res.status(200).json(updateduser);
//     } catch (error) {
//         res.status(500).json(error);
//     }
// });

router.post("/updateuser/:id", async (req, res) => {
    const { id } = req.params;
    console.log("update user")
    const userindividual = await users.findById(id);

 

    req.body.url = userindividual.url
    req.body.file = userindividual.file
    req.body.CollectionDate = userindividual.CollectionDate

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
    const day = String(currentDate.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    let tempRemark = {
        "date": formattedDate,
        "message": req.body.Remark
    }

    console.log('body remarks =',req.body.Remark)
    let userRemark = userindividual.Remark
    userRemark.push(tempRemark)
    req.body.Remark = userRemark
    console.log('remarks =',userRemark,req.body.Remark)

    if (req.body.remainingFees <= 0) {
        req.body.feesStatus = "Fees Completed"
    }
    else {
        req.body.feesStatus = "Fees Inmpleted"
    }

    const batchStartDate = new Date(req.body.BatchStartDate); // Assuming BatchStartDate is in a valid date format (e.g., 'YYYY-MM-DD')
    batchStartDate.setDate(batchStartDate.getDate() + 3); // Add 3 days

    if (batchStartDate.getDate() <= 3) {

        batchStartDate.setMonth(batchStartDate.getMonth());
        batchStartDate.setDate(3);
    }

    const dueDate = `${batchStartDate.getFullYear()}-${String(batchStartDate.getMonth() + 1).padStart(2, '0')}-${String(batchStartDate.getDate()).padStart(2, '0')}`;

    req.body.DueDate = dueDate;

    console.log("req body =", req.body)
    try {
        const { id } = req.params;
        console.log('user =', req.body)

       
        const updateduser = await users.findByIdAndUpdate(id, req.body, {
            new: true
        });

        // // console.log(updateduser);
        res.status(200).json(updateduser);
    } catch (error) {
        res.status(500).json(error);
    }
});

// delete student
// router.delete("/deleteuser/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         const deletedUser = await users.findByIdAndDelete(id);
        
//         let {Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate}
//           = deletedUser

//           console.log('name=',Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate)

//      const old = await oldStudent.create( {Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate})
//      console.log("old user", old)
//         res.status(200).json(deletedUser);
//     } catch (error) {
//         res.status(500).json(error);
//     }
// });

router.delete("/deleteuser/:id", async (req, res) => {
    console.log('delete user route')
    try {
        const { id } = req.params;

        const deletedUser = await users.findByIdAndUpdate(id,{$set:{courseRunningStatus:"active"}});
        
        let {Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate}
          = deletedUser

          console.log('name=',Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate)

    //  const old = await oldStudent.create( {Name,Number,Pname,Pnumber,BatchStartDate,Course,Counselor,Fees,feesStatus,remainingFees,TrainerName,BatchTiming,BatchMode,Payment,Remark,file,url,status,password,email,Batch,RegistrationFees,RegistrationDate,CollectionDate,DueDate,EnrollmentNo,TrainerID,CounselorID,paymentStatus,lastCollectionDate})
    //  console.log("old user", old)
        res.status(200).json(deletedUser);

    } 
    catch (error) {
        console.log('error =',error.message)
        res.status(500).json(error);
    }
});

// delete Demo

router.delete("/deleteDemo/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await NewDemo.findByIdAndDelete(id);

            console.log("demo id deleted=",id);
            let candidateData = await DemoStudent.deleteMany({
                DemoId: id
            });
          

        res.status(200).json(deletedUser);
    } catch (error) {
        console.log("message error =",error.message)
        res.status(500).json(error);
    }
});

// add demo student feedback route

router.put("/addDemoFeedback", async (req, res) => {
    try {
        const {studentId, status} = req.body

            let candidateData = await DemoStudent.findByIdAndUpdate({_id:studentId},{$set:{status:status}});
          

            console.log("add feedback =",candidateData)
        res.status(200).json(candidateData);
    } catch (error) {
        console.log("message error =",error.message)
        res.status(500).json(error);
    }
});

// add demo status route

router.put("/addDemoStatus", async (req, res) => {
    try {
        const {demoId, status} = req.body

            let demoData = await NewDemo.findByIdAndUpdate({_id:demoId},{$set:{status:status}});
          

            console.log("add feedback =",demoData)
        res.status(200).json(demoData);
    } catch (error) {
        console.log("message error =",error.message)
        res.status(500).json(error);
    }
});

router.delete("/deletetrainer/:id", async (req, res) => {
    const { id } = req.params;
    console.log('delete trainer route =',id)
    try {
       
        const deletedUser = await uploads.findByIdAndDelete(id);
        
        let {Name,Number,Email,Password,LinkedinId,Course,Batch,Headline,bio,file,url,Address,CompanyName}
          = deletedUser


     const old = await oldtrainer.create( {Name,Number,Email,Password,LinkedinId,Course,Batch,Headline,bio,file,url,Address,CompanyName})
     console.log("old user", old)
        res.status(200).json(deletedUser);
    } catch (error) {
        res.status(500).json(error);
    }
});
router.delete("/deletecounselor/:id", async (req, res) => {
    const { id } = req.params;
    console.log('delete counselor route =',id)
    try {
       
        const deletedUser = await counselors.findByIdAndDelete(id);
        
        let {Name,Number,Email,password,bio,file,url,Address}
          = deletedUser


     const old = await oldCounselor.create({Name,Number,Email,password,bio,file,url,Address})
     console.log("old user", old)
        res.status(200).json(deletedUser);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.delete("/deleteBatch/:id", async (req, res) => {
    
    try {
        const { id } = req.params;

        const deletedBatch = await runningBatches.findByIdAndDelete(id);
        
        console.log('running batch',deletedBatch)
        const { Batch, Trainer, TrainerID, BatchTime, Days } = deletedBatch;

        // Create a new document in deletedBatches
        const savedDeletedBatch = await deletedBatches.create({
          Batch,
          Trainer,
          TrainerID,
          BatchTime,
          Days,
        });

        console.log("before delete")
        // const savedDeletedBatch = await deleteBatch.save();
        console.log("after delete")

        
        // const addDeletedBatch = await deletedBatches.create(deletedBatch)
        console.log("addDeletedBatch=",savedDeletedBatch)
        res.status(200).json(deletedBatch);
    } catch (error) {
        res.status(500).json(error);
    }
});


router.get("/getStudentPayment/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const paymentData = await StudentFee.find({ user: id });
        res.status(200).json(paymentData);
    } catch (error) {
        res.status(500).json(error);
    }
});

// Installment
router.get("/ins", async (req, res) => {
    try {
        const installments = await inst.find({});
        res.send(installments);
    } catch (error) {
        res.status(500).json(error);
    }
});


// Teacher Assign
router.post("/uploadfile", controller.upload, async (req, res) => {
    req.body.url = req.url
    req.body.file = req.file
    console.log('upload route =',req.body)
    try {
        console.log('try block')
        // const newUser = new document(req.body);
        const savedUser = await uploaditem.create(req.body);
        // console.log("Fee Data",savedUser);
        res.status(200).json(savedUser);
    } catch (error) {
          console.log('else block')
        // console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post("/uploadNotesPdf", controller.upload, async (req, res) => {
    console.log('upload note pdf')
    req.body.url = req.url
    req.body.file = req.file
    console.log('upload route =',req.body)
    try {
        console.log('try block')
        // const newUser = new document(req.body);
        const savedUser = await Notes.create(req.body);
        // console.log("Fee Data",savedUser);
        res.status(200).json(savedUser);
    } catch (error) {
          console.log('else block')
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.post("/uploadNotesLink", async(req, res) => {
    console.log('upload note link')
    try {
        console.log('try block')
        // const newUser = new document(req.body);
        const savedUser = await Notes.create(req.body);
        // console.log("Fee Data",savedUser);
        res.status(200).json(savedUser);
    } catch (error) {
          console.log('else block')
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.post("/uploadClassUrl", async (req, res) => {
    // console.log("class body",req.body)
    

    try {
        // const newUser = new document(req.body);
        const savedUser = await uploadclassurl.create(req.body);
        // console.log("Fee Data",savedUser);
        res.status(200).json(savedUser);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

//trainer upload item url video 
router.post("/uploadAssignmentUrl", async (req, res) => {
    console.log("upload file", req.body)
    try {
        const savedUser = await uploaditem.create(req.body);
        res.status(200).json(savedUser);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});


//Get by student upload item url video
router.get("/getuploadAssignmentUrl", async (req, res) => {
    try {
        const item = await uploaditem.find({});
        res.send(item);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json(error);
    }
});

//Video

router.post("/uploadVideoUrl", async (req, res) => {
    console.log("video =", req.body)
    try {
        const savedUser = await uploadvideourl.create(req.body);
        res.status(200).json(savedUser);
    } catch (error) {
        console.log("error message =",error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

//get Video
router.get("/getuploadVideoUrl", async (req, res) => {
    const Batch = req.header('Batch')
    console.log('batch =', Batch)
    try {
        const item = await uploadvideourl.find({ batch: Batch });
        console.log('student item =', item)
        res.send(item);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json(error);
    }
});


// Document
router.get("/document", async (req, res) => {
    try {
        const currentDate = new Date();
        const docum = await document.find({});

        const response = {
            documents: docum,
            date: currentDate
        };
        res.send(response);
    } catch (error) {
        res.status(500).json(error);
    }
});

//  Student-profile
router.get("/studentpro", async (req, res) => {
    try {
        const student = await users.find({courseRunningStatus:"active"});
        // console.log('student =', student)
        res.send(student);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get("/getTrainerBatch", async (req, res) => {

    const TrainerId = req.header("id")

    try {
        let TrainerBatch = await runningBatch.find({ TrainerID: TrainerId })
        res.send(TrainerBatch)
    }
    catch (error) {
        res.send({ "error": error.message })
    }


})

router.post("/updatePaymentStatus/:id", async (req, res) => {
    const { id } = req.params
    try {
        let paymentStatus = await users.updateOne({ _id: id }, { $set: { paymentStatus: req.body.paymentStatus } }, { upsert: true })

        res.send({ "status": 200 })
    }
    catch (error) {
        // console.log("error =",error.message)
    }
})

router.post("/updatelastCollectionDate/:id", async (req, res) => {
    const { id } = req.params
    try {

        let paymentStatus = await users.updateOne({ _id: id }, { $set: { lastCollectionDate: req.body.lastCollectionDate, paymentStatus: req.body.paymentStatus } }, { upsert: true })
        // console.log("lastcollectionDate status =",paymentStatus)

    }
    catch (error) {
        // console.log("error =",error.message)
    }
})

//Student-profile display in Trainer Component
router.get("/pro", async (req, res) => {
    try {
        const trainers = await users.find({courseRunningStatus:"active"});
        res.send(trainers);
    } catch (error) {
        res.status(500).json(error);
    }
});


// Trainer profile
router.get("/trainer", async (req, res) => {
    console.log('trainer =', req.body)

    try {
        const trainers = await uploads.find({});
        // console.log("data =",trainers)
        res.send(trainers)
    }
    catch (error) {
        console.log('error =', error.message)
        res.send({ "error": error.message })
    }

});


router.get("/trainer/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('id =',id)

        const userindividual = await uploads.findById(id);
        // // console.log("user individual =", userindividual);
        res.send({ "status": "active", "userIndividual": userindividual });
    } catch (error) {
        res.status(500).json(error);
    }
});



//Add Trainer route

router.post("/addTrainer", async (req, res) => {
    
    sendmail(req,res)

    req.body.Email = req.body.email    
    
    let code = await generateCode(req.body.Name,req.body.mainCourse)
    req.body.code = code;

    
    // console.log('req trainer add=',code,req.body)
    try {
        const newUser = new uploads(req.body);
        const savedUser = await newUser.save();
        // console.log("Fee Data",savedUser)
        res.status(200).json(savedUser);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

const generateCode = async(name,course)=>{

    console.log('course =',course)
    let tempCourse = '';
    let splitCourse = course.split(' ')
    if (splitCourse.length > 1) {
        splitCourse.map(data => {
            tempCourse = `${tempCourse}${data[0]}`
        })
    }

    else {
        tempCourse = splitCourse[0]
    }

    let count = 0;
    count = `0${count+1}`
    let code = `UC/${(name[0]+name[1]).toUpperCase()}/${tempCourse}-`
    let tempCode = `${code}${count}`
    let codeStatus = false
    do{
        
        let getCode = await uploads.find({code:tempCode})  
          
        if(getCode.length!==0){
           let codeCount = parseInt(count.substr(0), 10);
           codeCount = codeCount + 1;
            
            tempCode = `${code}${codeCount.toString().padStart(2, '0')}`;
            codeStatus = true
        }
        else
        {
            codeStatus = false
            
             }

    }while(codeStatus)

    return tempCode

}

// update trainer route
router.post("/updatetrainer/:id", async (req, res) => {

    const {id} = req.params

    const trainerData = await uploads.findById(id)
    console.log('trainer select =',trainerData)

    req.body.url =  trainerData.url?trainerData.url:""
    req.body.file = trainerData.file
    try {
        const updateTrainer = await uploads.findByIdAndUpdate(id,req.body,{
            new:true
        })
        
        // console.log("Fee Data",savedUser)
        res.status(200).json(updateTrainer);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.post("/updateCounselor/:id", async (req, res) => {

    const {id} = req.params

    const counselorData = await counselors.findById(id)
    console.log('trainer select =',counselorData)

    req.body.url =  counselorData.url?counselorData.url:""
    req.body.file = counselorData.file?counselorData.file:""
    req.body.password = counselorData.password
    try {
        const updateCounselor = await counselors.findByIdAndUpdate(id,req.body,{
            new:true
        })
        
        // console.log("Fee Data",savedUser)
        res.status(200).json(updateCounselor);
    } catch (error) {
        // console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});


//filter date wise data
router.get('/filterByMonth', async (req, res) => {
    const month = req.query.month;
    try {
        const filteredData = await DataModel.find({ JoiningDate: { $regex: month, $options: 'i' } }).exec();
        res.json(filteredData);
    } catch (error) {
        // // console.error('Error executing query:', error);
        res.status(500).send('Error executing query');
    }
});


//Login router for student

router.post("/student", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await users.findOne({ email: email, password: password,courseRunningStatus:"active" }).lean();
        // // console.log('status =', username.status, username)

        if (username) {

            if (username.status === "active") {
                const data = {
                    user: {
                        id: username._id
                    },
                }

                delete username.password;
                // // console.log('trim user =', username)
                const authtoken = await jwt.sign(data, jwt_secret)
                res.send({ "status": "active", "authtoken": authtoken, "username": username })
            }

            else {
                res.send({ "status": "deactive" })

            }
        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid Password": error.message })
    }
})

// update Student password

router.post("/updatePassword/student", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await users.findOne({ email: email,courseRunningStatus:"active" });
        // // console.log('status =', username.status, username)

        if (username) {

            if (username.status === "active")
             {
            
                let updatePassword = await users.findByIdAndUpdate({_id:username._id}, {$set:{password:password}})
                res.send({ "status": "active" })

            }

            else {

                res.send({ "status": "deactive" })

            }
        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid Password": error.message })
    }
})

// update trainer password

router.post("/updatePassword/trainer", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await uploads.findOne({ email: email });
        // // console.log('status =', username.status, username)

        if (username) {

            if (username.status === "active")
             {
            
                let updatePassword = await uploads.findByIdAndUpdate({_id:username._id}, {$set:{password:password}})
                res.send({ "status": "active" })

            }

            else {

                res.send({ "status": "deactive" })

            }
        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid Password": error.message })
    }
})

// update counselor password

router.post("/updatePassword/admin", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await admins.findOne({ email: email });
        // // console.log('status =', username.status, username)

        if (username) {

            if (username.status === "active")
             {
            
                let updatePassword = await admins.findByIdAndUpdate({_id:username._id}, {$set:{password:password}})
                res.send({ "status": "active" })

            }

            else {

                res.send({ "status": "deactive" })

            }
        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid Password": error.message })
    }
})


router.post("/counsellor", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        // console.log('email =',email, password)

        const username = await counselors.findOne({ Email: email, password: password }).lean();
        // console.log('status =', username)

        if (username) {


            const data = {
                user: {
                    id: username._id
                },
            }

            delete username.password;
            // // console.log('trim user =', username)
            const authtoken = await jwt.sign(data, jwt_secret)
            res.send({ "status": "active", "authtoken": authtoken, "username": username })


        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid Password": error.message })
    }
})


router.post("/addCounselor", controller.upload, async (req, res) => {
    sendmail(req, res)

    try {
        console.log("add counselor =")
        const email = req.body.email;
        const password = req.body.password;
        req.body.file = req.file
        const url = req.url
        // console.log('email =',email, password)

        const lastCounselor  = await counselors.findOne({}, {}, { sort: { _id: -1 } }).exec(); // Sort by the default ObjectId in descending order
        
        let counselorNo = generateCounselorNo(lastCounselor)

        const username = await counselors.create({ Email: email, password: password, Number: req.body.Number, Address: req.body.Address, Name: req.body.Name, url: url, counselorNo : counselorNo });
        // console.log('status =', username)

        if (username) {
        
            res.send({ "status": "active", "username": username })

        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        console.log("add counselor error=",error.message)
        res.status(404).send({ "invalid Password": error.message })
    }
})




// Login router for Trainer

router.post("/trainer", async (req, res) => {

    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await uploads.findOne({ Email: email, Password: password }).lean();


        if (username) {

            const data = {
                user: {
                    id: username._id
                },
            }

            delete username.password;
            // // console.log('trim user =', username)
            const authtoken = await jwt.sign(data, jwt_secret)
            res.send({ "status": "active", "authtoken": authtoken, "username": username })
        }

        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid ": error.message })
    }
})

router.post("/counselor", async (req, res) => {
    console.log('counselor')

    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await counselors.findOne({ Email: email, Password: password }).lean();


        if (username) {

            const data = {
                user: {
                    id: username._id
                },
            }

            delete username.password;
            // // console.log('trim user =', username)
            const authtoken = await jwt.sign(data, jwt_secret)
            res.send({ "status": "active", "authtoken": authtoken, "username": username })
        }

        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        res.status(404).send({ "invalid ": error.message })
    }
})

router.post("/admin", async (req, res) => {
    console.log('admin =', req.body)
    try {
        const email = req.body.email;
        const password = req.body.password;

        const username = await admins.findOne({ email: email, password: password }).lean();
        console.log('status =', username)

        if (username) {

            if (username.status === "active") {
                const data = {
                    user: {
                        id: username._id
                    },
                }

                delete username.password;
                // // console.log('trim user =', username)
                const authtoken = await jwt.sign(data, jwt_secret)
                res.send({ "status": "active", "authtoken": authtoken, "username": username })
            }

            else {
                res.send({ "status": "deactive" })

            }
        }
        else {
            res.send({ "status": "false" })
        }

    } catch (error) {
        console.log('error =', error.message)
        res.status(404).send({ "invalid Password": error.message })
    }
})



router.post("/uploaditem", async (req, res) => {
    const itemName = req.body.fileName;
    const trainer = req.body.Name;
    const batch = req.body.batch;
    const course = req.body.course;

    try {
        let data = await uploaditem.create({
            itemName: itemName,
            trainer: trainer,
            batch: batch,
            course: course
        })
        res.send({ "success": true, "data": data })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})


router.get('/fetchuploadeditems', async (req, res) => {

    try {
        let fetchedItem = await uploaditem.find({})

        res.send({ "success": "true", "fetchData": fetchedItem })
    }

    catch (error) {
        res.send(error.message)
    }
})


router.post('/submititem', controller.upload, async (req, res) => {
    req.body.url = req.url
    req.body.file = req.file

    try {

        let submitItem = await submititem.create(req.body);

        res.send({ "success": true, "data": submitItem });
    } catch (error) {
        // // console.log("Error submitting item:", error);
        res.status(500).send({ "success": false, "error": "Error submitting item" });
    }
});


router.get('/getStudentPendingAssignment/:id',async(req,res)=>{ 
    const {id} = req.params
    const Batch = req.header('batch')
    console.log('batch =',Batch)

    let submittedAssigment = await submititem.find({studentId:id})

    let pendingAssignment = await uploaditem.find({batch:Batch})
    console.log('pending assignmnet before =',pendingAssignment,submittedAssigment)

    // console.log('pending assignment before filter=',pendingAssignment)
    // console.log('submit assignment before filter=',submittedAssigment)

    let Assignment = pendingAssignment.filter(data=>{
        let pendingStatus =true;
        submittedAssigment.map(element=>{
           
            if(data._id.toString()==element.assignmentId.toString())
         
            {
                console.log('if ')
                pendingStatus=false
            }
        })
       console.log('pending status =',pendingStatus)
        return pendingStatus
    })

    console.log('pending assignment =',Assignment)
    res.send(Assignment)

})

router.get('/getStudentAssignment/:id',async(req,res)=>{
    const {id} = req.params
    console.log('id =',id)
    let submittedAssigment = await submititem.find({assignmentId:id})

    console.log('submitted assignment student=',submittedAssigment)
    res.send(submittedAssigment)

})


router.get('/getStudentSubmittedAssignment/:id',async(req,res)=>{
    const {id} = req.params
    const batch = req.header("batch")
    let submittedAssigment = await submititem.find({studentId:id, batch:batch})
    console.log("submit student =",id,submittedAssigment,batch)
    res.send(submittedAssigment)

})
router.get('/getTrainerAssignment',async(req,res)=>{
    const batch = req.header("batch")
    console.log("get trainer Assignment =",batch)
    let submittedAssigment = await uploaditem.find({batch:batch})
    
    res.send(submittedAssigment)

})
router.get('/getTrainerNotesPdf',async(req,res)=>{
    const batch = req.header("batch")
    let submittedAssigment = await Notes.find({batch:batch, filetype:"pdf"})
    
    res.send(submittedAssigment)

})
router.get('/getTrainerNotesLink',async(req,res)=>{
    const batch = req.header("batch")
    let submittedAssigment = await Notes.find({batch:batch, filetype:"link"})
    
    res.send(submittedAssigment)

})


router.delete('/deleteTrainerAssignment/:id',async(req,res)=>{
    const {id} = req.params
    console.log(" delete id  =",id)
    try{
    let submittedAssigment = await uploaditem.findByIdAndDelete(id)
    
    res.send(submittedAssigment)
    }
    catch(error){
        console.log('error =',error.message)
    }

})
router.delete('/deleteVideo/:id',async(req,res)=>{
    const {id} = req.params
    console.log(" delete id  =",id)
    try{
    let deletedVideo = await uploadvideourl.findByIdAndDelete(id)
    
    res.send(deletedVideo   )
    }
    catch(error){
        console.log('error =',error.message)
    }

})
router.delete('/deleteNotes/:id',async(req,res)=>{
    const {id} = req.params
    console.log(" delete id  =",id)
    try{
    let deletedNotes = await Notes.findByIdAndDelete(id)
    
    res.send(deletedNotes)
    }
    catch(error){
        console.log('error =',error.message)
    }

})


router.get('/fetchsubmititem', async (req, res) => {

    try {
        let fetchedItem = await submititem.find({})
        // // console.log(fetchedItem)

        res.send({ "success": "true", "fetchData": fetchedItem })
    }

    catch (error) {
        res.send(error.message)
    }
})


// --------- Send message By Admin to batch ------------

router.post('/sendmessage', async (req, res) => {
    // console.log("req body =",req.body)
    const message = req.body.message;
    const from = req.body.from;
    const fromId = req.body.fromId;
    const checkid = req.body.checkid;
    const file = req.body.fileName;
    // // console.log('check id =', checkid, message, req.body)

    const data = {
        user: {
            id: checkid
        },
    }

    // // // console.log('data =', data.user)
    // // console.log('file type =', typeof (file), file)
    const messageauthtoken = await jwt.sign(data, jwt_secret)


    try {
        let senddata = await messagemodel.create({
            message,
            from,
            fromId,
            messageid: messageauthtoken,
            file: file
        })

        res.send(senddata)
    }
    catch (error) {
        res.send(error.message)
    }
})

router.post('/Studentsendmessage', async (req, res) => {
    // console.log("req body =",req.body)
    const message = req.body.message;
    const from = req.body.from;
    const checkid = req.body.checkid;
    const file = req.body.fileName;
    const EnrollmentNo = req.body.EnrollmentNo;
    const batch = req.body.batch
    // // console.log('check id =', checkid, message, req.body)

    const data = {
        user: {
            id: checkid
        },
    }

    // // // console.log('data =', data.user)
    // // console.log('file type =', typeof (file), file)
    const messageauthtoken = await jwt.sign(data, jwt_secret)


    try {
        let senddata = await Studentmessagemodel.create({
            message,
            from,
            messageid: messageauthtoken,
            file: file,
            EnrollmentNo,
            batch
        })

        res.send(senddata)
    }
    catch (error) {
        res.send(error.message)
    }
})




router.post('/sendStudentMessage', async (req, res) => {
    // console.log("req body =",req.body)
    const message = req.body.message;
    const from = req.body.from;
    const checkid = req.body.checkid;
    const file = req.body.fileName;
    // // console.log('check id =', checkid, message, req.body)

    const data = {
        user: {
            id: checkid
        },
    }

    // // // console.log('data =', data.user)
    // // console.log('file type =', typeof (file), file)
    const messageauthtoken = await jwt.sign(data, jwt_secret)


    try {
        let senddata = await messagemodel.create({
            message,
            from,
            messageid: messageauthtoken,
            file: file
        })

        res.send(senddata)
    }
    catch (error) {
        res.send(error.message)
    }
})


// router.get('/receivemessage/:id', async (req, res) => {
//     let {id} = req.params


//     try {
//         let fetchedItem = await messagemodel.find({})
//         let message =[];
//         fetchedItem.map((data,index)=>{

//             const fetchData = jwt.verify(data.messageid, jwt_secret);
//             // // console.log('message =',data.messageid)


//             fetchData.user.id.filter(element=>{

//                 if(id===element.id){

//                     message.push(fetchedItem[index].message)
//                 }
//                 else{
//                     false
//                 }
//             })

//         })
//        // // console.log('message =',message)


//         res.send({ "success": "true", "message": "message" })
//     }
//     catch (error) {
//         res.send(error.message)
//     }
// });


router.get('/receivemessage', async (req, res) => {

    let id = req.header("id")

    console.log('receive message id =',id)
    

    try {
        let fetchedItem = await messagemodel.find({})
        let message = [];
        // console.log('message =',fetchedItem)
     
        fetchedItem.map((data, index) => {

            const fetchData = jwt.verify(data.messageid, jwt_secret);

            fetchData.user.id.filter(element => {

                // console.log('id and element id =',id,element.id)
                if (id === element.id) 
                {
                    message.push({

                        message: fetchedItem[index].message,
                        from: fetchedItem[index].from,
                        date: fetchedItem[index].date
                    })
                }
                else {
                    false
                }
            })
        })
       
        res.send({ "success": "true", "message": message })
    }
    catch (error) {
        console.log("error from send route =",error.message)
        res.send(error.message)
        
    }
});

// route to get receive message

router.get('/receiveusermessage/:id', async (req, res) => {
    let { id } = req.params
    console.log('receive message id =',id)
    

    try {
        let fetchedItem = await messagemodel.find({fromId:id})
        // console.log('message =',fetchedItem)    
      
       
        res.send({ "success": "true", "message": fetchedItem })
    }
    catch (error) {
        console.log("error from send route =",error.message)
        res.send(error.message)
        
    }
});

router.get('/Studentreceivemessage', async (req, res) => {

    let id  = req.header("id")

    console.log('student receive message id in route =',id)

    try {
        let fetchedItem = await Studentmessagemodel.find({})
        let message = [];
        // console.log('message =',fetchedItem)
        fetchedItem.map((data, index) => {

            const fetchData = jwt.verify(data.messageid, jwt_secret);
            // console.log('fetchData =',fetchData.user.id)

            // console.log('message =',fetchData, id)

            // // console.log("user id type =", typeof (fetchData.user.id), index)
            fetchData.user.id.filter(element => {
                // console.log('element =',element)

                if (id === element.id) {
                     console.log('element and id =',id,element.id)
                    message.push({
                        message: fetchedItem[index].message,
                        from: fetchedItem[index].from,
                        date: fetchedItem[index].date,
                        batch: fetchedItem[index].batch,
                        EnrollmentNo: fetchedItem[index].EnrollmentNo
                    })
                }
                else {
                    false
                }
            })
        })
        // console.log('message 2 =', message)


        console.log("message =",message)
        res.send({ "success": "true", "message": message })
    }
    catch (error) {
        res.send(error.message)
    }
});

router.get('/getAdminId',async(req,res)=>{
    console.log("get admin id")
    let admin = await admins.find();

    console.log('admin = ',admin._id)
    res.send({"id":admin})
})

router.post('/sendotp', async (req, res) => {
    res.send('hello')
})

router.post('/sendmail', async (req, res) => {
    // // console.log('from router =', req.body)
    sendmail(req, res)
})

router.post('/resetpassword', async (req, res) => {
    // // console.log('email =', req.body.email)
    try {
        const username = await users.findOne({ email: req.body.email,courseRunningStatus:"active" });
        // // console.log('email username =', username)
        if (username) {
            resetpassword(req, res)

            const data = {
                user: {
                    email: username.email
                },
            }

            const authtoken = await jwt.sign(data, jwt_secret)
            res.send({ "send": "true", "resetlink": `http://localhost:3000/resetpassword?token=${authtoken}&user=${req.body.user}` })

        }
        else {
            res.send({ "send": "false" })
        }

    }
    catch (error) {
        // // console.log('error =', error)
        res.send({ "error": error })
    }


})

router.post('/newpassword', fetchuser, async (req, res) => {
    // // console.log("password =", req.body.newpassword, req.body.user)

    let fetchuserModel;
    if (req.body.user === "student") {
        fetchuserModel = users
    }


    try {
        let user = await fetchuserModel.findOne({ email: req.user.email });

        if (user) {
            let userPassword = await users.updateOne({ email: req.user.email,courseRunningStatus:"active" }, { $set: { password: req.body.newpassword } })

            res.send({ "userpassword": userPassword })
        }
        else {
            res.send({ "response": "no user exist" })
        }
    } catch (error) {
        res.send({ "error": error.message })
    }

})

router.post('/addAttendance', async (req, res) => {
    const { fullDate, date, month, year, presentId, absentId, Batch, trainerId } = req.body;


    const presentdata = {
        user: {
            id: presentId
        },
    }
    const absentdata = {
        user: {
            id: absentId
        },
    }

    const presentauthtoken = await jwt.sign(presentdata, jwt_secret)
    const absentauthtoken = await jwt.sign(absentdata, jwt_secret)
    const addAttendance = await attendance.create({
        fullDate,
        date,
        month,
        year,
        presentId: presentauthtoken,
        absentId: absentauthtoken,
        Batch: [Batch],
        trainerId: [trainerId]
    })

    console.log("add attendance =", req.body, addAttendance)
    res.send({ "status": "true", "attendance": addAttendance })
})


router.post('/updateAttendance', async (req, res) => {
    const { fullDate, date, month, year, presentId, absentId, Batch, trainerId } = req.body;
    // console.log("req body =", req.body)

    // // console.log('batch  =',Batch)
    let existAttendance = await attendance.find({ fullDate });
    // console.log('exist attendance ', existAttendance, fullDate)

    // check exist attendance of given date

    if (existAttendance.length != 0) {

        let presentStudentId = jwt.verify(existAttendance[0].presentId, jwt_secret)
        let absentStudentId = jwt.verify(existAttendance[0].absentId, jwt_secret)

        let tempAbsentID = absentStudentId.user.id;
        let tempPresentID = presentStudentId.user.id;

        let removeabsentId = [];
        let removepresentId = [];

        let newPresentidStatus = false;
        absentStudentId.user.id.map((data, index) => {
            let status = false;
            presentId.map(element => {
                if (data === element) {
                    newPresentidStatus = true
                    status = true
                    tempPresentID.push(data)
                    removeabsentId.push(data)
                }
            }
            )
            // status === false ? tempAbsentID.push(data) : false
        })

        if (newPresentidStatus === false)
            presentId.map(data => {
                tempPresentID.push(data)
            })

        let newAbsentidStatus = false;
        presentStudentId.user.id.map((data, index) => {
            let status = false;
            absentId.map(element => {
                if (data === element) {
                    newAbsentidStatus = true
                    status = true;
                    tempAbsentID.push(data)
                    removepresentId.push(data)
                }
            }
            )
            // status === false ? tempPresentID.push(data) : false

        })

        if (newAbsentidStatus === false)
            absentId.map(data => {
                tempAbsentID.push(data)
            })

        // // // console.log('length of absent =', tempAbsentID.length)
        // // // console.log('length of present =', tempPresentID.length)

        presentStudentId.user.id = tempPresentID.filter(data => {
            matchStatus = false;
            removepresentId.map(element => {
                if (data === element) {
                    matchStatus = true
                }
            })
            return matchStatus === false ? data : false
        });
        absentStudentId.user.id = tempAbsentID.filter(data => {
            matchStatus = false;
            removeabsentId.map(element => {
                if (data === element) {
                    matchStatus = true
                }
            })
            return matchStatus === false ? data : false
        });;

        // // // console.log('present =', presentStudentId)
        // // // console.log('absent =', absentStudentId)



        // // // console.log('absent id =', tempAbsentID, absentStudentId.user.id.length, tempPresentID, presentStudentId.user.id.length)

        const presentauthtoken = await jwt.sign(presentStudentId, jwt_secret)
        const absentauthtoken = await jwt.sign(absentStudentId, jwt_secret)

        let trainerStatus = false;
        existAttendance[0].trainerId.map(data => {
            if (data === trainerId) {
                trainerStatus = true
            }
        })
        if (trainerStatus === true) {
            let batchStatus = false
            existAttendance[0].Batch.map(data => {
                if (data === Batch) {
                    batchStatus = true
                }
            })

            if (batchStatus === true) {
                let updateAttendance = await attendance.update({ fullDate: fullDate }, { $set: { absentId: absentauthtoken, presentId: presentauthtoken } })
                // // // console.log('updateAttendance =', updateAttendance)
                res.send({ "status": "true", "attendance": updateAttendance })
            }



            else {

                let tempBatch = existAttendance[0].Batch;
                tempBatch.push(
                    Batch
                )

                let updateAttendance = await attendance.update({ fullDate: fullDate }, { $set: { absentId: absentauthtoken, presentId: presentauthtoken, Batch: tempBatch } })
                // // // console.log('updateAttendance =', updateAttendance)
                res.send({ "status": "true", "attendance": updateAttendance })

            }
        }

        else {
            let tempBatch = existAttendance[0].Batch;
            tempBatch.push(
                Batch
            )

            let tempTrainer = existAttendance[0].trainerId;
            tempTrainer.push(
                trainerId
            )

            let updateAttendance = await attendance.update({ fullDate: fullDate }, { $set: { absentId: absentauthtoken, presentId: presentauthtoken, Batch: tempBatch, trainerId: tempTrainer } })
            // // // console.log('updateAttendance =', updateAttendance)
            res.send({ "status": "true", "attendance": updateAttendance })

        }
    }


})

router.post('/addStudentAttendance',async(req,res)=>{
    console.log('req body =',req.body)
    try{

        let attendance = await Studentattendance.create(req.body)

        res.send(attendance)
    }
    catch(error){
        console.log('error =',error.message)
        res.send(error.message)
    }
})
router.post('/updateStudentAttendance',async(req,res)=>{
    console.log('req body =',req.body)
    try{

        let updateAttendance = await Studentattendance.updateOne({fullDate:req.body.fullDate, Batch:req.body.Batch}, {$set:{studentId:req.body.studentId, attendanceStatus:req.body.attendanceStatus}})
        res.send(updateAttendance)

    }
    catch(error){
        console.log('error =',error.message)
        res.send(error.message)
    }
})

router.post('/getAttendance', async (req, res) => {
    const { fullDate, Batch, trainerId } = req.body

    try {
        let attendanceData = await attendance.find({ fullDate, Batch, trainerId });
        console.log('attendance =', attendanceData, req.body)
        // console.log('attendance =', fullDate, attendanceData)

        attendanceData = attendanceData.sort((a, b) => {
            const dateA = new Date(`${a.fullDate}`);
            const dateB = new Date(`${b.fullDate}`);
            return dateA - dateB;
        });

        //   attendanceData = attendanceData.filter(data => {
        //     // console.log('data =', data);
        //     let batchStatus = false;
        //     data.Batch.map(batchElement => { // Use batchElement instead of element
        //         if (batchElement === Batch) { // Compare to the desired batch value
        //             batchStatus = true;
        //         }
        //     });
        //     return batchStatus; // Return data if batchStatus is true
        // });

        // attendanceData = attendanceData.filter(data => {
        //     // console.log('data =', data);
        //     let idStatus = false;
        //     data.trainerId.map(trainerid => { // Use batchElement instead of element
        //         if (trainerid === trainerId) { // Compare to the desired batch value
        //             idStatus = true;
        //         }
        //     });
        //     return idStatus; // Return data if batchStatus is true
        // });

        // console.log('attendance fetch =', attendanceData)
        if (attendanceData.length !== 0) {

            let presentStudentId = jwt.verify(attendanceData[0].presentId, jwt_secret)
            let absentStudentId = jwt.verify(attendanceData[0].absentId, jwt_secret)

            // // console.log('if')
            res.send({ 'status': "filled", 'monthAttendance': attendanceData, 'presentId': presentStudentId.user.id, 'absentId': absentStudentId.user.id })
        }

        else {
            res.send({ 'status': "empty" })
            // // console.log('else attendance = ',fullDate,attendanceData)
        }
    }
    catch (error) {

    }



})
router.post('/getStudentAttendance', async (req, res) => {
    const { fullDate, Batch, trainerId } = req.body

    try {
        let attendanceData = await Studentattendance.find({ fullDate, Batch, trainerId });
        console.log('attendance =', attendanceData, req.body)
        // console.log('attendance =', fullDate, attendanceData)

        attendanceData = attendanceData.sort((a, b) => {
            const dateA = new Date(`${a.fullDate}`);
            const dateB = new Date(`${b.fullDate}`);
            return dateA - dateB;
        });

        console.log("attendance =",attendanceData)
        res.send(attendanceData)
    }
    catch (error) {

    }



})



router.post('/getthreeDaysAttendance', async (req, res) => {
    let { month, year, currentDate } = { ...req.body }
    // // console.log('current date',currentDate)
    try {
        let getMonthAttendance = await attendance.find({
            "year": year,
            "month": month,
            "date": { "$gte": currentDate, "$lte": ((currentDate - 2).toString()) }
        });
        // console.log('three days attendance =', getMonthAttendance, typeof (((currentDate - 2).toString())), ((currentDate - 2).toString()))
        if (getMonthAttendance.length !== 0) {

            let presentStudentId = []
            let absentStudentId = []

            getMonthAttendance.sort((a, b) => {
                const dateA = new Date(`${a.fullDate}`);
                const dateB = new Date(`${b.fullDate}`);
                return dateA - dateB;
            }); users
            getMonthAttendance.map(data => {
                presentStudentId.push(jwt.verify(data.presentId, jwt_secret))
                absentStudentId.push(jwt.verify(data.absentId, jwt_secret))
            })

            // // console.log('month attendance =',getMonthAttendance)

            // let data = getMonthAttendance


            // // console.log("sorted data",getMonthAttendance);

            res.send({ "status": "filled", "monthAttendance": getMonthAttendance, 'presentId': presentStudentId, 'absentId': absentStudentId })
        }
        else {

            res.send({ "status": "empty" })
        }


    } catch (error) {
        res.send('error', error.message)
    }

})

// For Demo------
router.post("/demo", async (req, res) => {
    console.log('Demo', req.body)
    try {
        const demo = await NewDemo.create({
            Trainer: req.body.Trainer,
            TrainerId: req.body.TrainerId,
            Course: req.body.Course,
            Date: req.body.Date,
            Time: req.body.Time,
            month: req.body.month,
            year: req.body.year,
            day: req.body.day,
            classLink: req.body.classLink,
            CounselorId: req.body.CounselorId,
            CounselorName: req.body.CounselorName
        });
        res.send(demo);
    } catch (error) {
        res.status(500).json(error.message);
    }
});
router.post('/updateDemo/:id', async (req, res) => {
    try {
        console.log("req.body",req.body)
      const { id } = req.params;
      console.log('Updating Demo with ID:', id);
  
      // Update the user document
      const updatedUser = await NewDemo.findByIdAndUpdate(id, req.body, {
        new: true,
      });
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.send(updatedUser)
  
      // Update the FixDemo document
    //   const demoUpdate = await FixDemo.findByIdAndUpdate(id, {
    //     Name: req.body.Name,
    //     Email: req.body.Email,
    //     Trainer: req.body.Trainer,
    //     TrainerId: req.body.TrainerId,
    //     Course: req.body.Course,
    //     Date: req.body.Date,
    //     Time: req.body.Time,
    //     Background: req.body.Background,
    //     month: req.body.month,
    //     year: req.body.year,
    //     day: req.body.day,
    //     classLink: req.body.classLink,
    //     CounselorId: req.body.CounselorId,
    //     CounselorName: req.body.CounselorName,
    //     status: req.body.status,
    //   }, {
    //     new: true,
    //   });
  
    //   if (!demoUpdate) {
    //     return res.status(404).json({ error: 'Demo not found' });
    //   }
  
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
router.post('/updateDemoStudent/:id', async (req, res) => {
    try {
        console.log("req.body",req.body)
      const { id } = req.params;
      console.log('Updating Demo with ID:', id);
  
      // Update the user document
      const updatedDemoStudent = await DemoStudent.findByIdAndUpdate(id, req.body, {
        new: true,
      });
  
      if (!updatedDemoStudent) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.send(updatedDemoStudent)
      
 
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

router.post('/adddemoStudent/:id', async (req, res) => {
    try {
        console.log("req.body",req.body)
      const { id } = req.params;
      req.body.DemoId = id
      req.body.status = "process"
      console.log('Updating Demo with ID:', id);
  
      const demoStudent = await DemoStudent.create( req.body);
  
      if (!demoStudent) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.send(demoStudent)
    
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });


router.get("/Getdemo", async (req, res) => {

    let totalCandidate = []
    let totalCandidateData = []
    try {
        const demo = await NewDemo.find({});

        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }
     

          res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})

    } catch (error) {
        res.status(500).json(error);
    }
});


router.get("/GetAlldemo", async (req, res) => {
    
    console.log("get all demo")

    let totalCandidate = []
    let totalCandidateData = []

    try {
        let demo = await NewDemo.find({});
        
        demo = filterDemo(demo)

        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }
      
          res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post('/getMonthAttendance', async (req, res) => {
    let { year, month,batch } = req.body
    console.log("getMonthAttendance ",req.body)

    try {
        let filterAttendance = await Studentattendance.find({
            "year": year,
            "month": month,
            "Batch":batch
        });
        console.log('filter =', filterAttendance)


        filterAttendance = filterAttendance.sort((a, b) => {
            const dateA = new Date(`${a.fullDate}`);
            const dateB = new Date(`${b.fullDate}`);
            return dateA - dateB;
        });


        res.send({ "filterAttendance": filterAttendance })
    }
    catch (error) {
        res.send(error.message)
    }


})

router.post('/fetchadmin', fetchuser, async (req, res) => {
    // // console.log('id =', req.user)

    try {
        let adminData = await admins.findOne({ _id: req.user.id })

        if (adminData) {
            res.send({ "status": "active", "data": adminData })
        }

        else {
            res.send({ "status": "deactive" })
        }
    }
    catch (error) {
        res.send({ "status": "server error" })
    }
})

router.post('/fetchtrainer', fetchuser, async (req, res) => {
    // // console.log('id =', req.user)

    try {
        let trainerData = await uploads.findOne({ _id: req.user.id })

        // // console.log('trainer data= ',trainerData)
        if (trainerData) {
            res.send({ "status": "active", "data": trainerData })
        }

        else {
            res.send({ "status": "deactive" })
        }
    }
    catch (error) {
        res.send({ "status": "server error" })
    }
})

router.post('/fetchcounselor', fetchuser, async (req, res) => {
    // // console.log('id =', req.user)

    try {
        let counselorData = await counselors.findOne({ _id: req.user.id })

        // // console.log('trainer data= ',trainerData)
        if (counselorData) {
            res.send({ "status": "active", "data": counselorData })
        }

        else {
            res.send({ "status": "deactive" })
        }
    }
    catch (error) {
        res.send({ "status": "server error" })
    }
})
router.get('/fetchcounselor/:id', async (req, res) => {
    // // console.log('id =', req.user)
    const {id}  = req.params
    console.log("id  =",id)

    try {
        let counselorData = await counselors.findOne({ _id: id })

        // // console.log('trainer data= ',trainerData)
        if (counselorData) {
            res.send({ "status": "active", "data": counselorData })
        }

        else {
            res.send({ "status": "deactive" })
        }
    }
    catch (error) {
        res.send({ "status": "server error" })
    }
})

router.post('/fetchstudent', fetchuser, async (req, res) => {
    // // console.log('fetch id =', req.user)

    try {
        // // console.log("try fecth run")
        let studentData = await users.findOne({ _id: req.user.id,courseRunningStatus:"active" })
        // // console.log('student data =',studentData)

        if (studentData) {
            res.send({ "status": "active", "data": studentData })
        }

        else {
            res.send({ "status": "deactive" })
        }
    }
    catch (error) {
        // // console.log('fetch catch=',error.message)
        res.send({ "status": "server error" })
    }
})


router.post('/getTrainerUpcomingDemoes', async (req, res) => {
    const { TrainerId, month, day, year } = { ...req.body }
    // // console.log('Trainer demo =', TrainerName, month, day, year)
    let totalCandidate = []
    let totalCandidateData = []

    try {

        let demo = await NewDemo.find({
            "TrainerId": TrainerId,
            "month": month,
            "year": year,
            "day": { "$gte": day }
        })

        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }


        // // console.log('demo =',demo)
        res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})

// filter demo function

const filterDemo = (data) => {
    console.log('filter demo function')
    let sameDateTime = [];
    let studentData = [];
    data.map((demoData, demoIndex) => {
        let sameDateStatus = false;
        sameDateTime.map((dateTimeData, index) => {
            console.log('demodata=', demoData.Time, dateTimeData.date, demoData.Date, dateTimeData.time, demoIndex)
            if (demoData.Time === dateTimeData.time && demoData.Date === dateTimeData.date) {
                console.log('if demo', demoIndex)
                sameDateStatus = true;
                studentData[index].push(demoData)
            }
        })
        if (sameDateStatus === false) {
            console.log('else demo')

            sameDateTime.push({
                date: demoData.Date,
                time: demoData.Time,
                link: demoData.classLink,
                CounselorName: (demoData.CounselorName?demoData.CounselorName:""),
                Trainer: (demoData.Trainer?demoData.Trainer:""),
                TrainerId: (demoData.TrainerId?demoData.TrainerId:""),
                CounselorId:(demoData.CounselorId?demoData.CounselorId:"")
            })

            studentData.push([demoData])
        }
    })

    console.log('demo overview =',sameDateTime,studentData)
    return {"demolist":sameDateTime, "demoStudent":studentData}
   
}

// get range demo
router.get('/getRangeDemoes', async (req, res) => {
    console.log("get range  demo")
    let startDate = req.header("startDate");

    let endDate = req.header("endDate");
    console.log(' startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year)
  const endMonth = endDate.split('/')[1]
  const startMonth = startDate.split('/')[1]

 startDate = new Date(startDate);
 endDate = new Date(endDate);

  let monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    try {

        let demo = await NewDemo.find()
        // console.log('demo =',demo)
        
        let totalCandidate = []
        let totalCandidateData = []

        let finalDemo = demo.filter(data=>{
            const itemDateStr = data.Date;
            const itemDate = new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })

        for (const data of finalDemo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:finalDemo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
        // res.send(finalDemoData)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})

// counselor range demoes

router.get('/getCounselorRangeDemoes', async (req, res) => {
   
    let startDate = req.header("startDate");

    const id = req.header("id")

    console.log("get range  demo from id",id)

    let endDate = req.header("endDate");
    console.log(' startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year)
  const endMonth = endDate.split('/')[1]
  const startMonth = startDate.split('/')[1]

 startDate = new Date(startDate);
 endDate = new Date(endDate);

  let monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    try {

        let demo = await NewDemo.find({CounselorId:id})
               
        let totalCandidate = []
        let totalCandidateData = []

        let finalDemo = demo.filter(data=>{
            const itemDateStr = data.Date;
            const itemDate = new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })

        for (const data of finalDemo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:finalDemo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
        // res.send(finalDemoData)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})


// get range counselor demo 

router.get('/getRangeCounselorDemoes/:id', async (req, res) => {
    console.log("get range  demo")
    const {id} = req.params
    let startDate = req.header("startDate");

    let endDate = req.header("endDate");
    console.log(' startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year)
  const endMonth = endDate.split('/')[1]
  const startMonth = startDate.split('/')[1]

 startDate = new Date(startDate);
 endDate = new Date(endDate);

  let monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    try {

        let demo = await NewDemo.find({CounselorId:id})
        // console.log('demo =',demo)
        
        let totalCandidate = []
        let totalCandidateData = []

        let finalDemo = demo.filter(data=>{
            const itemDateStr = data.Date;
            const itemDate = new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })

        for (const data of finalDemo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:finalDemo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
        // res.send(finalDemoData)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})

// get range trainer demo
router.get('/getRangeTrainerDemoes/:id', async (req, res) => {
    console.log("get range  demo")
    const {id} = req.params
    let startDate = req.header("startDate");

    let endDate = req.header("endDate");
    console.log(' startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year)
  const endMonth = endDate.split('/')[1]
  const startMonth = startDate.split('/')[1]

 startDate = new Date(startDate);
 endDate = new Date(endDate);

  let monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    try {

        let demo = await NewDemo.find({TrainerId:id})
        // console.log('demo =',demo)
        
        let totalCandidate = []
        let totalCandidateData = []

        let finalDemo = demo.filter(data=>{
            const itemDateStr = data.Date;
            const itemDate = new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })

        for (const data of finalDemo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:finalDemo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
        // res.send(finalDemoData)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})

// get range register student
router.get('/getRangeRegisteredStudent', async (req, res) => {
   
    let startDate = req.header("startDate");

    let endDate = req.header("endDate");
    console.log(' startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year

        startDate = new Date(startDate);
        endDate = new Date(endDate);


    try {

        let register = await registerStudent.find()
      
            let finalRegister = register.filter(data=>{
            const itemDateStr = data.RegistrationDate;
            const itemDate    =    new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })


        console.log('final regsiter =',finalRegister)
        res.send(finalRegister)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})


// get range stduent fees

router.get('/getRangeFees', async (req, res) => {
   
    let startDate = req.header("startDate");

    let endDate = req.header("endDate");
    console.log('get fees startDate  ',startDate,endDate)
    // // console.log('Trainer demo =', TrainerName, month, day, year

        startDate = new Date(startDate);
        endDate = new Date(endDate);


    try {

        let student = await StudentFee.find()
      
            let studentFees = student.filter(data=>{
            const itemDateStr = data.CollectionDate;
            const itemDate    =    new Date(itemDateStr);
          
            return itemDate >= startDate && itemDate <= endDate;
        })

        
    let totalAmount = 0;

    studentFees.map(data=>{
        totalAmount = totalAmount + parseInt(data.amount)
    })
    console.log('total fees =',totalAmount)
    const formattedFees = formatRupees(totalAmount);
    const feesInWords = convertToWords(totalAmount);

        console.log('student fees =',studentFees)
        res.send({"studentFees":studentFees,"formattedFees":formattedFees,"feesInWords":feesInWords })
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})


// need to replace it
router.post('/getDemoesCounselor', async (req, res) => {
    const { CounselorId, month, day, year } = { ...req.body }
    // // console.log('Trainer demo =', TrainerName, month, day, year)

    try {

        let demo = await FixDemo.find({
            "CounselorId": CounselorId,
            "month": month,
            "year": year,
            "day": { "$gte": day }
        })


        // // console.log('demo =',demo)
        res.send(demo)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getCounselorDemo', async (req, res) => {
    const id  = req.header("id")
    console.log("counselor id from func=",id)

    try {


        let totalCandidate = []
        let totalCandidateData = []

        let demo = await NewDemo.find({
            "CounselorId": id,
        })

        // console.log("demo =",demo)

        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

        
        // console.log("d =",totalCandidate,totalCandidateData)

        res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})

router.post('/getupcomingDemoes', async (req, res) => {
    const { month, day, year } = { ...req.body }
    // // console.log('Trainer demo =', TrainerName, month, day, year)

    
    let totalCandidate = []
    let totalCandidateData = []

    try {

        let demo = await NewDemo.find({
            "month": month,
            "year": year,
            "day": { "$gte": day }
        })

        
        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }


        // // console.log('demo =',demo)
        res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.post('/getupcomingtrainerDemoes/:id', async (req, res) => {
    const {id} = req.params
    const { month, day, year } = { ...req.body }
    console.log('Trainer demo =', month, day, year,id)

    try {

        let demo = await FixDemo.find({
            "month": month,
            "year": year,
            "TrainerId":id,
            "day": { "$gte": day }
        })


        // console.log('demo =',demo)
        demo = filterDemo(demo)
        res.send(demo)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getNewDemo/:month', async (req, res) => {
    const month = req.params
   
    let totalCandidate = []
    let totalCandidateData = []
    // // console.log('Trainer demo =', TrainerName, month, day, year)

    try {

        let demo = await NewDemo.find(month)
        // console.log('new demo =',demo)

        for (const data of demo) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:demo, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        res.send(error.message)
    }
})
router.post('/getDemoesByCounselor', async (req, res) => {
    const { CounselorId } = { ...req.body }
    // // console.log('Trainer demo =', TrainerName, month, day, year)

    try {

        let demoCounselor = await FixDemo.find({
            "CounselorId": CounselorId,
        })


        console.log('demoCounselor =',demoCounselor)
        res.send(demoCounselor)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getDemoesByTrainer/:id', async (req, res) => {
    const { id } = req.params
    // // console.log('Trainer demo =', TrainerName, month, day, year)
    let totalCandidate = []
    let totalCandidateData = []
    try {

        let demoTrainer = await NewDemo.find({
            "TrainerId": id,
        })

        for (const data of demoTrainer) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

        res.send({Demo:demoTrainer, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getDemoesByCounselor/:id', async (req, res) => {
    const { id } = req.params
    // // console.log('Trainer demo =', TrainerName, month, day, year)
    try {

        let demoCounselor = await FixDemo.find({
            "CounselorId": id,
        })

        console.log('demoCounselor =',demoCounselor)
        res.send(demoCounselor)
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getNewDemoesByTrainer/:id', async (req, res) => {
    console.log("new demoes route")
    const { id } = req.params
    const month = req.header("month")
    console.log("month and id =",id,month)
    
    let totalCandidate = []
    let totalCandidateData = []
    // // console.log('Trainer demo =', TrainerName, month, day, year)
    try {

        let demoTrainer = await NewDemo.find({
            "TrainerId": id,
            "month":month
        })

        for (const data of demoTrainer) {
            // console.log("demo id =", data._id);
            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

        
        res.send({Demo:demoTrainer, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        // // console.log('error =',error.message)
        res.send(error.message)
    }
})
router.get('/getNewDemoesByCounselor', async (req, res) => {
    let totalCandidate = []
    let totalCandidateData = []
    const id  = req.header("id")
    console.log("new demoes route", id)
    const month = req.header("month")
    console.log("month and id =",id,month)
    // // console.log('Trainer demo =', TrainerName, month, day, year)
    try {

        let demoCounselor = await NewDemo.find({
            "CounselorId": id,
            "month":month
        })

        
        for (const data of demoCounselor) {

            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:demoCounselor, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        console.log('error new demo counselor=',error.message)
        res.send(error.message)
    }
})
router.post('/getUpcomingDemoesByCounselor', async (req, res) => {
    let totalCandidate = []
    let totalCandidateData = []

    try {

        let demoCounselor = await NewDemo.find({
            "CounselorId": req.body.CounselorId,
            "day":req.body.day,
            "month":req.body.month,
            "year":req.body.year
        })

        
        for (const data of demoCounselor) {

            let candidateData = await DemoStudent.find({
              DemoId: data._id
            });
            totalCandidate.push(candidateData.length);
            totalCandidateData.push(candidateData);
          }

          res.send({Demo:demoCounselor, totalStudent:totalCandidate, totalDemoStudent:totalCandidateData})
    }

    catch (error) {
        console.log('error new demo counselor=',error.message)
        res.send(error.message)
    }
})

// const getIntegerTime = (time)=>{
//     let timeParts = time.split(':');
//     let hours = parseInt(timeParts[0]);
//     let minutes = parseInt(timeParts[1].replace(/[^0-9]/g, '')); // Remove 'AM' or 'PM' if present
//     let isPM = time.includes('PM');
  
//     // Convert to 24-hour format
//     if (isPM && hours < 12) {
//       hours += 12;
//     } else if (!isPM && hours === 12) {
//       hours = 0;
//     }
  
//     const formattedTime = (hours < 10 ? '0' : '') + hours + (minutes < 10 ? '0' : '') + minutes;
//     console.log("Formatted time =", formattedTime);
//     return formattedTime
// }


// router.post('/getUpcomingDemoesByCounselor', async (req, res) => {
//     let totalCandidate = [];
//     let totalCandidateData = [];
//     console.log('req body of upcoming demoes =',req.body)
  
//     try {
//       let demoCounselor = await NewDemo.find({
//         "CounselorId": req.body.CounselorId,
//         "day": req.body.day,
//         "month": req.body.month,
//         "year": req.body.year,
//  // Compare demo time with the current time
//       });

//       let checkTime = getIntegerTime(req.body.time)

//       demoCounselor = demoCounselor.filter(data => {
//         let time = getIntegerTime(data.Time)

//         return time>=checkTime
//       });
      

//       console.log('demoCounselor upcoming demoes=',demoCounselor)
  
//       for (const data of demoCounselor) {
//         let candidateData = await DemoStudent.find({
//           DemoId: data._id
//         });
//         totalCandidate.push(candidateData.length);
//         totalCandidateData.push(candidateData);
//       }
  
//       res.send({
//         Demo: demoCounselor,
//         totalStudent: totalCandidate,
//         totalDemoStudent: totalCandidateData
//       });
//     } catch (error) {
//       console.log('error new demo counselor=', error.message)
//       res.send(error.message);
//     }
//   });
  



router.post('/getStudentByTrainer', async (req, res) => {
    try {
        let filterStudent = await users.find({ AllTrainerId: req.body.TrainerId,courseRunningStatus:"active" }).select("-password -email -Number -Fees -Payment -status")
        console.log('filterStudent =',filterStudent.length, req.body.TrainerId)
        res.send({ "status": "ok", "data": filterStudent })
    }
    catch (error) {
        res.send({ "status": "fail", "message": error.message })
    }
})

router.get('/getrunningBatch', async (req, res) => {

    try {
        let runningBatches = await runningBatch.find({})
        res.send({ "status": "active", "runningBatches": runningBatches })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

// get Running Batch by batch Name


router.get('/getrunningBatchbyBatchName', async (req, res) => {

    let batch = req.header("batch")

    try {
        let runningBatches = await runningBatch.find({Batch:batch})
        res.send({ "status": "active", "runningBatches": runningBatches })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})


router.get('/getrunningBatchByTrainer', async (req, res) => {

    const id  = req.header("id")
    try {
        let trainerRunningBatches = await runningBatch.find({"TrainerID":id})
        res.send({ "status": "active", "trainerRunningBatches": trainerRunningBatches })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

router.get('/getRunningBatchStudent', async (req, res) => {

const batch = req.header("batch")
console.log('batch = ',batch)
    try {
        let studentRunningBatches = await users.find({studentRunningBatch:batch,courseRunningStatus:"active"})
        // console.log("running student =",studentRunningBatches)
        res.send({ "status": "active", "studentRunningBatches": studentRunningBatches })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
}
)

router.get("/getAllBatches", async (req, res) => {
   
    try {
        let BatchCourse = await batches.find({})
        res.send({ "status": "active", "batchCourse": BatchCourse })

        console.log('get all batches =',BatchCourse);
    }
    

    catch (error) {
        res.send({ "error": error.message })
    }
})

// get All Main Course

router.get("/getAllMainCourse", async (req, res) => {

    try {
        let mainCourse = await subCourse.find({})
        res.send({ "status": "active", "mainCourse": mainCourse })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

// add weekdays and weekEnd batch

router.post("/addNewBatchTime", async (req, res) => {

    console.log("body =",req.body)
    let days = req.body.days
    let batchTime = req.body.batchTime
    try {
        let newBatchTime;
        if(days==="WeekDays"){
            newBatchTime = await batches.update({},{$set:{WeekDaysBatch:batchTime}})
        }
        else{
            newBatchTime = await batches.update({},{$set:{WeekEndBatch:batchTime}})
        }
   
        res.send({ "status": "active", "batchCourse": newBatchTime })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

// edit running Batch

router.post('/updateBatch/:id', async (req, res) => {

    const {id} = req.params

    const details = req.body
    const { Batch, Trainer, TrainerID, BatchTime, courseName, Days } = details;
 
   
    try {
    
        let updateBatch = await runningBatch.findByIdAndUpdate({_id:id},{$set:details.tempInpVal})
        let batchStudent = await users.find({studentRunningBatch:details.tempInpVal.previousBatch,courseRunningStatus:"active"})

        for(let i=0; i<batchStudent.length; i++){
            let filterBatch = getTotalBatch(batchStudent[i],details.tempInpVal)
            console.log('filter Batch = ',filterBatch)
            let updateStudentBatch = await users.findByIdAndUpdate({_id:batchStudent[i]._id},{$set:{studentRunningBatch:filterBatch}})
        }

        res.send({ "status": "active", "batchCourse": updateBatch })

    }
    catch (error) {
    
    }
})

const getTotalBatch =(student,details)=>{

    console.log('before filter =',student.studentRunningBatch)
let filterStudentBatch = student.studentRunningBatch.filter(data=>{
    return data!==details.previousBatch
})

filterStudentBatch.push(details.Batch)
  return filterStudentBatch
}

router.post("/addNewCourse", async (req, res) => {

    let course = req.body.course
    console.log("course =",course)

    try {
        let batch = await batches.find()
        console.log("batch =",batch)
        let BatchCourse = await batches.updateOne({}, {$set:{Course:course}})

        let data ={
            mainCourse:req.body.mainCourse,
            subCourse:[]
        }
        
        let addNewMainCourse = await subCourse.create(data)

        res.send({ "status": "active", "batchCourse": BatchCourse })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})


// new Course

router.post("/addNewSubCourse", async (req, res) => {

    try {
       
        let Course = await subCourse.findOne({mainCourse:req.body.mainCourse})

        let mainSubcourse = Course.subCourse
        console.log('subCourse =',Course,mainSubcourse,req.body)
        mainSubcourse.push(req.body.subCourse)
        let updateCourse = await subCourse.findByIdAndUpdate({_id:Course._id},{$set:{subCourse:mainSubcourse}})

        res.send({ "status": "active" })
    }
    catch (error) {
        console.log("error =",error.message)
        res.send({ "error": error.message })
    }
})

router.post("/addNewWeekDayTiming", async (req, res) => {

    let weekDays = req.body.weekDays
    console.log("course =",weekDays)

    try {
        let batch = await batches.find()
        console.log("batch =",batch)
        let BatchCourse = await batches.updateOne({}, {$set:{WeekDaysBatch:weekDays}})
        res.send({ "status": "active", "batchCourse": BatchCourse })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

router.post('/getRunningBatchTrainer', async (req, res) => {
    try {
        let runningbatchTrainer = await runningBatches.find({ TrainerID: req.body.TrainerID })
        res.send({ "status": "active", "runningbatchTrainer": runningbatchTrainer })
    }
    catch (error) {
        res.send({ "error": error.message })
    }
})

// get single batch detail

router.get('/getBatchData', async (req, res) => {
    let batch = req.header("batch")
    try {
        let batchData = await runningBatches.findOne({ Batch: batch })
        console.log("batch data route = ",batchData,batch)
        res.send({ "status": "active", "batchData": batchData })
    
    }

    catch (error) {
        res.send({ "error": error.message })
    }
})


router.post('/addNewBatch', async (req, res) => {
    try {
        let addNewBatch = await runningBatches.create(req.body)

        res.send({ 'status': 200 })
        // // console.log('add new batch =',addNewBatch)
    }
    catch (error) {
        res.send({ "error": error.message })
        // // console.log('error =',error.message)
    }
})


// route to get all counselor data

router.get('/getAllCounselor', async (req, res) => {
    try {
        const counselorData = await counselors.find({});
        res.send({ "status": "active", "counselorData": counselorData })
    }
    catch (error) {
        res.send({ "status": "error" })

    }
})


// route to get trainer total Student

// router.get('/getTrainerStudent',async(req,res)=>{
//     let TrainerStudent = 
// })

router.get("/counselor/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('id =',id)

        const userindividual = await counselors.findById(id);
        // // console.log("user individual =", userindividual);
        res.send({ "status": "active", "userIndividual": userindividual });
    } catch (error) {
        res.status(500).json(error);
    }
});

// get demo single student

router.get("/getdemoStudent/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('id =',id)

        const userindividual = await FixDemo.findById(id);
        // // console.log("user individual =", userindividual);
        res.send({ "status": "active", "userIndividual": userindividual });
    } catch (error) {
        res.status(500).json(error);
    }
});



router.get("/counselorStudent/:id", async (req, res) => {
    const {id} = req.params
    console.log('id= ',id)
    // console.log('counselor =',req.headers.counselorname, req.headers)
    try {

        const studentData = await users.find({ CounselorID: id,courseRunningStatus:"active" });
        // // console.log("user individual =", userindividual);
        res.send({ "status": "active", "counselorStudent": studentData });
    } catch (error) {
        res.status(500).json(error);
    }
});

//Fee Router----

router.post("/AddFee/:id", controller.upload, async (req, res) => {

    console.log("add fees route")

    const { id } = req.params
    const userindividual = await users.findById(id);
    // console.log("ad fee router from =",req.params, req.body)
    req.body.url = req.url
    req.body.file = req.file
    req.body.user = userindividual.EnrollmentNo
    req.body.Name = userindividual.Name
    req.body.EnrollmentNo = userindividual.EnrollmentNo
    req.body.Batch = userindividual.Batch
    req.body.CounselorId = userindividual.CounselorID
    req.body.Counselor = userindividual.Counselor
    req.body.Phone = parseInt(userindividual.Number)
    // console.log("ad fee router =",req.params, req.body)
    try {
        const newUser = new StudentFee(req.body);
        const savedUser = await newUser.save();
        // console.log("Fee Data",savedUser)

        if (savedUser) {
          
            let collectionDate = userindividual.CollectionDate
            collectionDate.push(req.body.CollectionDate)
            let remainingFees = userindividual.remainingFees - req.body.amount
            let paidFees = userindividual.paidFees + parseInt(req.body.amount)

            const updateUser = await users.updateOne({ _id: id }, { $set: { CollectionDate: collectionDate, lastCollectionDate: req.body.CollectionDate, remainingFees: remainingFees, paidFees:paidFees } }, { upsert: true })
            if (updateUser) { 

                await updateDueDate(req.body.CollectionDate, userindividual, id, remainingFees,paidFees)

            }

            res.status(200).json(savedUser);
        }


    } catch (error) {
        console.log("error message from fees route=",error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// const updateDueDate = async (collection, student, id, remainingFees,paidFees) => {
//     // Parse collection date and due date
//     const collectionDate = new Date(collection);
//     const dueDate = new Date(student.DueDate);

//     // Calculate the year and month for collection and due dates
//     const collectionDateYear = collectionDate.getFullYear();
//     const collectionDateMonth = collectionDate.getMonth() + 1;
//     const dueDateYear = dueDate.getFullYear();
//     const dueDateMonth = dueDate.getMonth() + 1;


//     console.log('collection month =', collectionDateMonth, dueDateMonth)

//     // Calculate the difference in months between collection and due dates
//     const monthDifference = (collectionDateYear - dueDateYear) * 12 + (collectionDateMonth - dueDateMonth);

//     console.log('remaining fees =', remainingFees)
//     if (remainingFees <= 0) {
//         console.log('less than zero')
//         // Fees are completed, set the payment status and remove DueDate
//         const updateUser = await users.updateOne(
//             { _id: id },
//             { $set: { paymentStatus: "Fees Completed", DueDate: "No Due Date", feesStatus: "Fees Completed" } },
//             { upsert: true }
//         );
//     } else {
//         if (collectionDateMonth === dueDateMonth) {
//             // If collection month is the same as the due date month, increment due date by 1 month
//             dueDate.setMonth(dueDate.getMonth() + 1);
//         } else if (collectionDateMonth > dueDateMonth && collectionDateYear === dueDateYear) {
//             // If collection month is greater than due date month and same year
//             if (collectionDate.getDate() <= dueDate.getDate() + 5 || collectionDate.getDate() > dueDate.getDat()) {
//                 // If collection date is more than 5 days away from due date, increment due date by 1 month
//                 dueDate.setMonth(collectionDate.getMonth() + 1);
//             }
//         }

//         // Format the nextDueDate
//         const nextDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(
//             dueDate.getDate()
//         ).padStart(2, '0')}`;

//         // Update the user's DueDate
//         const updateUser = await users.updateOne({ _id: id }, { $set: { DueDate: nextDueDate } }, { upsert: true });
//     }
// };

// update due date 

const updateDueDate = async (collection, student, id, remainingFees,paidFees) => {

    console.log('remaining fees =', remainingFees,paidFees)
    if (remainingFees <= 0) {
        console.log('less than zero')
        // Fees are completed, set the payment status and remove DueDate
        const updateUser = await users.updateOne(
            { _id: id },
            { $set: { paymentStatus: "paid", DueDate: "Fees Completed", feesStatus: "Fees Completed" } },
            { upsert: true }
        );
    } 
    
   else{
    
    let duedate
    let minimumFees 

    // if(paidFees>=student.Installment && paidFees<student.Installment*2){
    // console.log("if 1 =",paidFees,student.Installment)

    // let instString = (student.Installment).toString()

    //     duedate = student.InstallmentDate[instString]
    //     minimumFees  = student.Installment-paidFees
    // }
    // else if(paidFees>=student.Installment*2 && paidFees<student.Installment*3){
        
    //     let instString = (student.Installment*2).toString()
    //     minimumFees  = (student.Installment*2)-paidFees
    //     console.log("if 2 =",paidFees,student.Installment,student.InstallmentDate,student.InstallmentDate)

    //     duedate = student.InstallmentDate[instString]
    // }
    // else if(paidFees>=student.Installment*3 && paidFees<student.Installment*4){
    // console.log("if 3 =",paidFees,student.Installment)

    // minimumFees  = (student.Installment*3)-paidFees
    // let instString = (student.Installment*3).toString()

    //     duedate = student.InstallmentDate[instString]
    // }
    // else if(paidFees>=student.Installment*4){

    //  minimumFees  = (student.Installment*4)-paidFees
    // console.log("if 4 =",paidFees,student.Installment*2)

    //     duedate = "Fees Completeted"
    // }

    if(paidFees<student.Installment){
        console.log("if 1 =",paidFees,student.Installment)
    
        let instString = (student.Installment).toString()
    
            duedate = student.InstallmentDate[instString]
            minimumFees  = student.Installment-paidFees
        }
        else if(paidFees<student.Installment*2 && paidFees>=student.Installment){
            
            let instString = (student.Installment*2).toString()
            minimumFees  = (student.Installment*2)-paidFees
            console.log("if 2 =",paidFees,student.Installment,student.InstallmentDate,student.InstallmentDate)
    
            duedate = student.InstallmentDate[instString]
        }
        else if(paidFees<student.Installment*3 && paidFees>=student.Installment*2){
        console.log("if 3 =",paidFees,student.Installment)
    
        minimumFees  = (student.Installment*3)-paidFees
        let instString = (student.Installment*3).toString()
    
            duedate = student.InstallmentDate[instString]
        }
        else if(paidFees<student.Installment*4 && paidFees>=student.Installment*3)
        {

        console.log("if 3 =",paidFees,student.Installment)
    
        minimumFees  = (student.Installment*4)-paidFees
        let instString = (student.Installment*4).toString()
    
        duedate = student.InstallmentDate[instString]
        }
        else if(paidFees>=student.Installment*4){
    
         minimumFees  = (student.Installment*4)-paidFees
        console.log("if 4 =",paidFees,student.Installment*2)
    
            duedate = "Fees Completeted"
        }

    const updateUser = await users.updateOne(
        { _id: id },
        { $set: { paymentStatus: "paid", DueDate: duedate, minimumFees : minimumFees } },
        { upsert: true }
    );
    
   }
};


router.get("/getfee/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const userindividual = await StudentFee.findById(id);
        // // console.log("user individual =", userindividual);
        res.status(200).json(userindividual);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post("/FeeDetail/:id", async (req, res) => {

    try {
        const { id } = req.params;

        // // console.log('req.body.user =', req.body)
        const updateduser = await StudentFee.findByIdAndUpdate(id, req.body, {

            new: true
        });
        // console.log("update user =",updateduser)

        res.status(200).json(updateduser);
    } catch (error) 
    {
        // console.log("error =",error.message)

        res.status(500).json(error);
    }

});

//----------get Fee
router.get("/FeeTable", async (req, res) => {
    try {
        const userdata = await StudentFee.find()
        // // console.log('user data =',userdata)
        res.status(200).json(userdata);
    } catch (error) {
        // console.log('error =', error.message)
        res.status(500).json(error);
    }
});

// Delete fee
router.delete("/deleteFee/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await StudentFee.findByIdAndDelete(id);
        res.status(200).json(deletedUser);
    } catch (error) {
        res.status(500).json(error);
    }
});


// old student get Route

// router.get("/getOldStudent",async(req,res)=>{
//     let old = await oldStudent.find()  
//     res.send({"oldStudent":old})
// })


router.get("/getOldStudent",async(req,res)=>{
    let old = await users.find({courseRunningStatus:"deactive"})  
    res.send({"oldStudent":old})
})

router.get("/getOldBatch",async(req,res)=>{
    let oldBatches = await deletedBatches.find()

    console.log('old batch =',oldBatches)
    res.send({"oldBatches":oldBatches})
})

// route to get batch student 

router.get("/getbatchStudent",async(req,res)=>{
    const batch = req.header("batch")
    console.log("batch =",batch)
    let oldBatches = await users.find({studentRunningBatch:batch})

    console.log('old batch =',oldBatches)
    res.send({"oldBatches":oldBatches})
})

// router to move student to other batch


router.post("/moveStudent",async(req,res)=>{
    const currentBatch = req.body.currentBatch
    const newBatch = req.body.newBatch
    const id = req.body.id
    let newbatch = await runningBatches.findOne({Batch:newBatch})
    let currentbatch = await runningBatches.findOne({Batch:currentBatch})
    let student = await users.findById({_id:id})
    console.log('current and new batch =',currentBatch,newBatch,id,student.studentRunningBatch)

    // console.log('student =',student)
    let oldBatchStudent=[]
    let oldTrainer=[]
    let oldTrainerId=[]
    
    if(student.studentOldBatch)
    {
        oldBatchStudent = student.studentOldBatch
        oldTrainer = student.OldTrainer
        oldTrainerId = student.OldTrainerId

    }
    
    let runningBatchstudent = student.studentRunningBatch.filter(data=>{
        return data!==currentBatch
    })
    let AllTrainer = student.AllTrainer.filter(data=>{
        return data!==currentbatch.Trainer
    })
    let AllTrainerId = student.AllTrainerId.filter(data=>{
        return data!==currentbatch.TrainerID
    })

    runningBatchstudent.push(newBatch)
    AllTrainer.push(newbatch.Trainer)
    AllTrainerId.push(newbatch.TrainerID)

    oldBatchStudent.push(currentBatch)
    oldTrainer.push(currentbatch.Trainer)
    oldTrainerId.push(currentbatch.TrainerID)

    let updateStudent = await users.findByIdAndUpdate({_id:id}, {$set:{studentRunningBatch:runningBatchstudent,studentOldBatch:oldBatchStudent, AllTrainer:AllTrainer, AllTrainerId:AllTrainerId, OldTrainer:oldTrainer, OldTrainerId:oldTrainerId}})

    // console.log('old batch =',runningBatchstudent,oldBatchStudent)
    res.send({"oldBatches":oldBatchStudent,"newBatches":runningBatchstudent})

})

// router to add student to new batch
router.post("/addStudent",async(req,res)=>{

    console.log('current batch =',req.body.currentBatch)
    const currentBatch = req.body.currentBatch
    const newBatch = req.body.newBatch
    const id = req.body.id
    let newbatch = await runningBatches.findOne({Batch:newBatch})
    let student = await users.findById({_id:id})
    console.log('new batch =',newbatch)
   
    // console.log('student =',student) 
        
    let runningBatchstudent = student.studentRunningBatch
    let AllTrainer = student.AllTrainer
    let AllTrainerId = student.AllTrainerId

    runningBatchstudent.push(newBatch)
    AllTrainer.push(newbatch.Trainer)
    AllTrainerId.push(newbatch.TrainerID)

    let updateStudent = await users.findByIdAndUpdate({_id:id}, {$set:{studentRunningBatch:runningBatchstudent, AllTrainer:AllTrainer, AllTrainerId:AllTrainerId}})
    
    res.send({"newBatches":runningBatchstudent})

})

module.exports = router;






