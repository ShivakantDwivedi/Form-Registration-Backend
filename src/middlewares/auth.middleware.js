import { aynchHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models.js";


export const verifyJWT = aynchHandler ( async (req, res, next) => {

    try {
        console.log(req.cookies.accessToken)
        const token = req.cookies?.accessToken || req.header ("Authorization")?.replace("Bearer ", "")
        console.log('Token is found', token);

        if(!token){
            throw new ApiError(401 , 'Unauthorized request')
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        console.log('Decoded Token is ' , decodedToken)
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
    
        if(!user)
        {
            // Discuss about frontend
            throw new ApiError(400 , 'Invalid Access Token')
        }
        
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 ,'Invalid user found')
    }
})