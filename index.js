const express = require('express');
const  cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require ("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY )



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
    const userWishOfferCollection = client.db('everNest').collection('userWishOffer')
    const paymentsCollection = client.db('everNest').collection('payments')

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
     //use verify agent after verifyToken
     const verifyFraud = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isFraud = user?.role === 'fraud';
      if(isFraud){
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
    //user verify agent after verify token
    app.get('/users/fraud/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email!== req.decoded.email){
       return res.status(403).send({message:'forbidden access'});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
       let fraud  = false;
       if(user){
        fraud = await user?.role === 'fraud';
       }
       res.send({fraud});
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
    //user fraud confirm
    app.patch('/users/fraud/:id',verifyToken,verifyAdmin, async (req, res) => {
     const id = req.params.id;
     const filter = {_id: new ObjectId(id)};
     const updatedDoc = {
       $set: {
         role:'fraud'
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

// allProperties post from client side
app.post('/allProperties',async(req,res)=>{
  const item = req.body;
  const result = await allPropertiesCollection.insertOne(item)
  res.send(result);
 })

  //allProperties Delete from client side 
  app.delete('/allProperties/:id',verifyToken,verifyAgent, async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await allPropertiesCollection.deleteOne(query);
    res.send(result);
   })

    // update My post
    app.put("/allProperties/:id",verifyToken,verifyAgent, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const options = { upsert: true };
      const filter = {
        _id: new ObjectId(id),
      };
      const updateProperty = {
        $set: {
          title: data.title,
      location: data.location,
      agentName: data.agentName,
      agentImage: data.agentImage,
      verificationStatus: data.verificationStatus,
      description: data.description,
      img: data.img,
      maxPrice: data.maxPrice,
      minPrice: data.minPrice,
      status:data.status,
      agentEmail: data.agentEmail,
        },
      };
      const result = await allPropertiesCollection.updateOne(
        filter,
        updateProperty,
        options
      );
      res.send(result);
    });


     //verify that all properties
     app.patch('/allProperties/verify/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          verificationStatus:'Verified'
        }
        
      }
      const result = await allPropertiesCollection.updateOne(filter, updatedDoc)
      res.send(result)
     })
     //verify that all properties
     app.patch('/allProperties/reject/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          verificationStatus:'Not Verified'
        }
        
      }
      const result = await allPropertiesCollection.updateOne(filter, updatedDoc)
      res.send(result)
     })

// add to wish list post from client side
app.post('/wishlist',async(req,res)=>{
  const item = req.body;
  const result = await wishlistCollection.insertOne(item)
  res.send(result);
 })

   //all wishlist read /get sent client side
   app.get('/wishlist',async(req, res)=>{
    const result = await wishlistCollection.find().toArray();
    res.send(result);
})

// delete wishList from client side
app.delete('/wishlist/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await wishlistCollection.deleteOne(query);
  res.send(result);
 })

  // userWishOffer post from Client side
app.post('/userWishOffer',async(req,res)=>{
  const review = req.body;
  const result = await userWishOfferCollection.insertOne(review)
  res.send(result);
 })

    //all userWishOffer read /get sent client side
    app.get('/userWishOffer',async(req, res)=>{
      const result = await userWishOfferCollection.find().toArray();
      res.send(result);
  })

  //property Accepted
  app.patch('/userWishOffer/accepted/:id',verifyToken,verifyAgent, async (req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        status:'accepted'
      }
      
    }
    const result = await userWishOfferCollection.updateOne(filter, updatedDoc)
    res.send(result)
   })

  //property rejected
  app.patch('/userWishOffer/rejected/:id',verifyToken,verifyAgent, async (req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        status:'rejected'
      }
      
    }
    const result = await userWishOfferCollection.updateOne(filter, updatedDoc)
    res.send(result)
   })

 // all reviews post from Client side
app.post('/allReviews',async(req,res)=>{
  const review = req.body;
  const result = await allReviewsCollection.insertOne(review)
  res.send(result);
 })


  //all reviews read /get sent client side
  app.get('/allReviews',async(req, res)=>{

    const result = await allReviewsCollection.find().sort({ _id: -1 }).toArray();
    res.send(result);
})

// delete AllReview from client side
app.delete('/allReviews/:id',verifyToken, async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await allReviewsCollection.deleteOne(query);
  res.send(result);
 })




 //payment intent 
 app.post('/create-payment-intent', async(req,res)=>{
  const {price} = req.body;
  const amount = parseInt(price*100)

  const paymentIntent = await stripe.paymentIntents.create({
   amount: amount,
   currency: 'usd',
   payment_method_types: ['card']
  });

  res.send({
   clientSecret: paymentIntent.client_secret 
  })
})

//payment history post 
app.post('/payments',async(req,res)=>{
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment)
  res.send(result);
 })


  //payment read /get sent client side
  app.get('/payments',async(req, res)=>{
    const result = await paymentsCollection.find().toArray();
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
