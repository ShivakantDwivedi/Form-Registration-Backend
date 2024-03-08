import mongoose  from 'mongoose'

import { DB_NAME } from '../constants.js'

import dotenv from 'dotenv'
dotenv.config()

const connectDB = ( async() => {
    try {
      const connectDatabaseInstance =  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      console.log("Connected")
      //console.log(connectDatabaseInstance);
    } catch (error) {
        console.log("Error occure", error)
        process.exit(1) 
    }
})

export default connectDB