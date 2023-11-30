
const  cors = require('cors');
const express = require('express');
const applyMiddleware = (app) => {
     //middleware
app.use(cors());
app.use(express.json());
};

module.exports =  applyMiddleware