const express = require('express');
const  cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require ("dotenv").config();
const port = process.env.PORT || 5000;



//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
    const allPropertiesCollection = client.db('everNest').collection('allProperties')
    const wishlistCollection = client.db('everNest').collection('wishlist')
    const allReviewsCollection = client.db('everNest').collection('allReviews')

     //jwt related api
     app.post('/jwt',async (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN,{
        expiresIn:'2h'
      });
      res.send({token})
     })




     //use verify admin after verifyToken
     const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
         return res.status(403).send({message:'forbidden access'})
      }
      next();
   }
     //use verify agent after verifyToken
     const verifyAgent = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isAgent = user?.role === 'agent';
      if(!isAgent){
         return res.status(403).send({message:'forbidden access'})
      }
      next();
   }




     //middlewares
     const verifyToken = (req, res,next) =>{
      if(!req.headers.authorization){
       return res.status(401).send({message:' unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN,(err,decoded)=>{
        if(err){
         return res.status(401).send({message:'unauthorized access '})
        }
        req.decoded = decoded;
        next();
      })
     
    }



    app.get('/users/admin/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email!== req.decoded.email){
       return res.status(403).send({message:'forbidden access'});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
       let admin  = false;
       if(user){
         admin = await user?.role === 'admin';
       }
       res.send({admin});
    })
    //user verify agent after verify token
    app.get('/users/agent/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email!== req.decoded.email){
       return res.status(403).send({message:'forbidden access'});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
       let agent  = false;
       if(user){
         agent = await user?.role === 'agent';
       }
       res.send({agent});
    })



    //users related api
    app.get('/users',async(req, res)=>{
     const result = await userCollection.find().toArray();
     res.send(result);
    })

    //delete user 
    app.delete('/users/:id',verifyToken,verifyAdmin, async(req, res)=>{
     const id = req.params.id;
     const query = {_id: new ObjectId(id)};
     const result = await userCollection.deleteOne(query);
     res.send(result);
    })

    //user Agent confirm
    app.patch('/users/agent/:id',verifyToken,verifyAdmin, async (req, res) => {
     const id = req.params.id;
     const filter = {_id: new ObjectId(id)};
     const updatedDoc = {
       $set: {
         role:'agent'
       }
       
     }
     const result = await userCollection.updateOne(filter, updatedDoc)
     res.send(result)
    })
    //user Admin confirm
    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async (req, res) => {
     const id = req.params.id;
     const filter = {_id: new ObjectId(id)};
     const updatedDoc = {
       $set: {
         role:'admin'
       }
       
     }
     const result = await userCollection.updateOne(filter, updatedDoc)
     res.send(result)
    })

   

    
    app.post('/users', async (req, res) => {
     const user = req.body;
     const query = {email:user.email}
     const existingUser = await userCollection.findOne(query);
     if(existingUser){
       return res.send({message:'user already exists',insertedId:null})
     }
     const result = await userCollection.insertOne(user)
     res.send(result);
    });

    //feature Properties read /get
    app.get('/featureProperties',async(req, res)=>{
     const result = await featurePropertiesCollection.find().toArray();
     res.send(result);
})
    //allProperties read /get
    app.get('/allProperties',async(req, res)=>{
     const result = await allPropertiesCollection.find().toArray();
     res.send(result);
})

// add to wish list post from client side
app.post('/wishlist',async(req,res)=>{
  const item = req.body;
  const result = await wishlistCollection.insertOne(item)
  res.send(result);
 })

 // all reviews post from Client side
app.post('/allReviews',async(req,res)=>{
  const review = req.body;
  const result = await allReviewsCollection.insertOne(review)
  res.send(result);
 })

  //all reviews read /get sent client side
  app.get('/allReviews',async(req, res)=>{
    const result = await allReviewsCollection.find().toArray();
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
