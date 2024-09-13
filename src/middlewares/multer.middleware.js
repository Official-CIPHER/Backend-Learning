// Multer - using this as middleware so that we can use it as our need
import multer from "multer";


// DiskStorage - Multer configuration for stoaring the file 
const storage = multer.diskStorage({
    // file inside multer , cb- callback
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // letter to added at the end with file uploaded
        //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)

        // it not better to keep originalname because if there are multiple file with same name then it create problem
        // But we keep it beacuse it only available for a very small amount of time
        cb(null, file.originalname)
    }
  })
  
export  const upload = multer({ 
    storage,
})