// Goal - file comes from file system which file has already uploaded on the server
// It gives the local file path if it uses any service and we upload on cloudinary
// Its required to  delete the file from the server if it upload on cloudinary 
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"


// Cloudinary Configuration- gives you the permission to upload the file 
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (loaclFilePath) => {
    try {
        if(!loaclFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(loaclFilePath,{
            resource_type:'auto'
        })
        // file has been uploaded successfully
        console.log("File is uploaded on Cloudinary !!!",response.url);
        // In console url will be display
        return response; 
    } catch (error) {
        fs.unlinkSync(loaclFilePath) // remove the loaclly saved temporary file as the upload operation got failed
        return null;
    }
}


export {uploadOnCloudinary}