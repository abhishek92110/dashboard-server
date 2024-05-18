const uploadFile = require("../middleware/upload");
const fs = require("fs");
const path = require('path');
const baseUrl = "http://localhost:8000/files/";

console.log('file controller')

const upload = async (req,res,next) => {
  console.log('upload function')
  try {
    // console.log('user1 =',req.file)
    await uploadFile(req, res);
    // console.log('user =',req.file)

    if (req.file === undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    req.url  =baseUrl+req.file.originalname;
    req.file = req.file.originalname.split('.');
    req.file = req.file[0]
    console.log('before next function =')
    next();
    // res.status(200).send({
    //   message: "Uploaded the file successfully: " + req.file.originalname,

    // });
  } 
  catch (err) {
    console.log(err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.body.file}. ${err}`,

    });
  }
};



const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";
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
        name: file,
        url: baseUrl + file,
        date: date,

      });
    });

    res.status(200).send(fileInfos);
  });
};


const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";
  console.log("checking directory",directoryPath + fileName)

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};



const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  download,
  remove,
  removeSync,
};
