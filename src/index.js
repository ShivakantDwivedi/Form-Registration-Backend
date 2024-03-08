import  dotenv from 'dotenv'

import { DB_NAME } from './constants.js';

import connectDB from './db/index.js'

import {app} from './app.js'

dotenv.config({ path: './env' });


// return promise
connectDB()
.then( () => {
    app.listen( process.env.PORT || 8000  , () => {
        console.log(` Server is running at port ${process.env.PORT}`);
            

        // app.on("error" , (error) => {
        //     console.log("ERRR" , error);
        //     throw error
        // })
    })
} )
.catch( (error) => {
    console.log("mongodb connection failed" , error);
} )







/*
import mongoose from 'mongoose';

import { DB_NAME } from './constants';

import express from 'express'

const app = express()

( async () => {
    try {

       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)


       app.on("error" , (error) => {
        console.log("ERRR" , error);
        throw console.error();
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
       })

    } catch (error) {

        console.log("ERROR" , error);
        throw err

    }
} )()


*/

