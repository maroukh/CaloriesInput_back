const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/");
  },
  filename: (req, file, cb) => {
    file.filename = getUniqueFileName(req)+"."+file.originalname.split('.')[file.originalname.split('.').length-1]
    console.log(file.filename);
    cb(null, file.filename);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;

function getUniqueFileName(req){
  var fileName = Math.floor(Math.random() * 100);
  fileName+= Date.now();
  fileName+= req.userId;
  fileName+= Math.floor(Math.random() * 100);
  return fileName;
}
