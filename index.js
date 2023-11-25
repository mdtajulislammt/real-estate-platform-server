const express = require('express');
const  cors = require('cors');
const app = express();
require ("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const featurePropertiesCollection = client.db('everNest').collection('featureProperties')
    const userCollection = client.db('everNest').collection('users')

    //users related api 
    app.post('/users', async (req, res) => {
     const user = req.body;
     // const query = {email:user.email}
     // const existingUser = await userCollection.findOne(query);
     // if(existingUser){
     //   return res.send({message:'user already exists',insertedId:null})
     // }
     const result = await userCollection.insertOne(user)
     res.send(result);
    });

    //feature Properties read /get
    app.get('/featureProperties',async(req, res)=>{
     const result = await featurePropertiesCollection.find().toArray();
     res.send(result);
})

    // Send a ping to confirm a successful connection
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
     res.send(' server in running ')
});

app.listen(port,()=>{
     console.log(`server is running on port ${port}`)
})
