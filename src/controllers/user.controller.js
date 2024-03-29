import { aynchHandler } from "../utils/asynchHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.models.js";

import {uploadOneCloudinary} from "../utils/cloudinary.js"

import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from 'jsonwebtoken'


const generateAcessAndRefreshToken = async ( userId ) => {

    try {

        const user = await User.findById(userId)
        console.log('User Data' , user)
        const accessToken = user.generateAccessToken()
        console.log('Access Token ',accessToken )
        const refreshToken = user.generateRefreshToken()
        console.log('Before updation Refresh Token ',refreshToken )

        //refresh token save into database
        user.refreshToken = refreshToken
        // inside save validateBeforeSave because ye kill kr deta hai database ke andar data 
        await user.save({ validateBeforSave :false })

        return { accessToken , refreshToken }

    } catch (error) {
        throw new ApiError('500', 'Something went wrong while generatting refresh and Acess Token')
    }


}


const registerUser= aynchHandler( async(req , res) => {

    
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
   console.log("Show here" , {existingUser});


    if(existingUser)
    {
        throw new ApiError(409 , "User with email alredy exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
   console.log("File path",avatarLocalPath);
   console.log("Request Path", req.files);


   // console.log("Request file response data",req.files);
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
//console.log(createdUser)
   if(!createdUser){
    throw new ApiError(500 , "Something went wrong while registring user ")
   }


   return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered sucessfully" )
   )

} )


const loginUser = aynchHandler (async(req,res) => {

// login work

// username and emmail from reqbody
// validate username or email
//  check same username or email are exist into database
// validate password
// access token and refresh token   
// adding cokkies 


const {username , email , password} = req.body
console.log(username)
console.log(password)
console.log(email)

if(!username && !email)
{
    throw new ApiError('400' , 'Username or email are required')
}

const user = await User.findOne({
    $or : [{username} ,{ email }]
})
console.log('User is' , user)

const isPasswordValidate = await user.isPasswordCorrect(password)

if(!isPasswordValidate)
{
    throw new ApiError(400 , 'Password  is not matching')
}

const { refreshToken, accessToken } = await generateAcessAndRefreshToken(user._id)

const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

const options = {
    httpOnly : true,
    secure : true
}

return res
.status(200)
.cookie("accessToken" , accessToken , options)
console.log('Cokkies Access Token is ', accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200,
        {
            user : loggedInUser , accessToken , refreshToken
        },
        "User logged in Sucessfully"
    )
)
}


)


const logoutUser = aynchHandler( async (req, res) => {
    
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken:undefined
            }
        },
        {
            new  : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie('accessToken' , options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200 , {} , 'User logged Out'))

})


const refreshAccessToken = aynchHandler(async (req, res) => {

    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if( !incommingRefreshToken )
    {
        throw new ApiError('401' , 'Unauthorized Request')
    }

   try {
     const decodedToken = jwt.verify(
         incommingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
 
     if(!user)
     {
         throw new ApiError(401, 'Invalid Refresh Token')
     }
 
     if( incommingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, 'Refresh Token is expired or used')
     }
 
     const options = {
         httpOnly : true,
         secure:true
     }
 
   const {accessToken,newrefreshToken} =  await generateAcessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken" , accessToken, options)
     .cookie("refreshToken" , newrefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken , newrefreshToken},
             "Access token refreshed "
         )
     )
   } catch (error) {
        throw new ApiError(401, 'Invalid Refresh Token')
   }
})    


const changedConfirmPassword = aynchHandler( async (req, res) => {

    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?.id)
    
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400 , 'Invalid Password')
    }
    
    user.password = newPassword

    await user.save({validateBeforSave:false})

    return res
    .status(200)
    .json( new ApiResponse (200 , {} , 'Password Changed Sucessfully'))


})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,

}