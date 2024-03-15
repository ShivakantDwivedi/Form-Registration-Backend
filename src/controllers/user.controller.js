import { aynchHandler } from "../utils/asynchHandler.js";

import { ApiError } from "../utils/ApiError.js";


import { User } from "../models/user.models.js";

import {uploadOneCloudinary} from "../utils/cloudinary.js"

import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = aynchHandler( async(req , res) => {
    // res.status(200).json({
    //     message:'ok'
    // })
    

    //  Steps for registration of form 

    //  take the all entity and data from frontend
    //  validate that email is not empty
    //  check Did useremail has alredy registered or not
    //  check for image and avatar has commed from fronted
    //  uplode image and avatar to the clodinary --- Avatar is compulsary to be uploded
    //  create an object User -- and insert into database
    //  take response from an object and check is response is comming
    //  remove password and refereshed token from the response
    // check response has commed or not is not theen check user has created sucessfully
    // return respose


    const {fullName , email , username , password , microsoft, videoFiles, isPublished } = req.body
   
    // console.log("fullName" ,fullName);
    //  console.log("email",email);
    //  console.log("username",username);
    // console.log("password",password);
    // console.log("microsoft",microsoft);
    // console.log("videoFiles", videoFiles);
    // console.log("ispublished", isPublished);


    if(
        [fullName, email , username , password].some( (field) => field ?.trim() === "" )
    ){
        throw new ApiError(400, 'All field are')
    }



   const existingUser =  await User.findOne({
        $or: [{ username } , { email }]
    })
  //  console.log("Show here" , {existingUser});

    if(existingUser)
    {
        throw new ApiError(409 , "User with email alredy exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
   console.log("File path",avatarLocalPath);
   console.log("Request Path", req.files);


//    let avatarLocalPath;

//    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0 )
//    {
//     avatarLocalPath = req.files.avatar[0]
//    }



    const coverImageLocalPath = req.files?.coverImage[0]?.path

   

    if(!avatarLocalPath){
        throw new ApiError(400, 'Avatar file is required')
    }

   const avatar = await uploadOneCloudinary(avatarLocalPath)
   const coverImage = await uploadOneCloudinary(coverImageLocalPath)

    


   if(!avatar)
   {
    throw new ApiError(400, "Avatar file is required")
   }

 const entityCreated = await  User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()

   })

   

   const createdUser = await User.findById(entityCreated._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500 , "Something went wrong while registring user ")
   }


   return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered sucessfully" )
   )

}  )


export default registerUser