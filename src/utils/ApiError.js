class ApiError extends Error {
    constructor(
        statusCode ,
        message = "Something went wrong",
        errors = [],
        stack =" "
    ){
        super(message) 
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.sucess = false
        this.errors = errors

        if(this.stack)
        {
            this.stack = this.statck
        }else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}