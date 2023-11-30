const express = require('express');
const app = express();
require ("dotenv").config();
const port = process.env.PORT || 5000;



app.get('/health', (req, res) => {
     res.send(' server in running ')
});

app.all('*', (req, res,next) => {
 const error = new Error(`the requested url is invalid : ${req.url}`);
 error.status = 404;
 next(error);
})

app.use((err,req,res,next)=>{
     res.status(err.status || 500).json({
          message: err.message
     })
})



const main = async()=>{
     await connectDB()
     app.listen(port,()=>{
          console.log(`server is running on port ${port}`)
     })
}
main();
