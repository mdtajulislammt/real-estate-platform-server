const mongoose = require('mongoose')
require ("dotenv").config();


const getConnectionString =()=>{


     let connectionURI;

     if(process.env.NODE_ENV === 'development'){
          connectionURI= process.env.DB_URI
     }else{
           connectionURI = process.env.DB_URI 
     }

     return connectionURI
} 

const connectDB = async()=>{
     const uri = getConnectionString()

     await mongoose.connect(uri,)
}

module.exports = connectDB