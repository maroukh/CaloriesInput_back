module.exports = app => {
    const meals = require("../controllers/meal.controller.js");
    const { authJwt } = require("../middlewares");
  
    var router = require("express").Router();
  
    // Create a new Meal
    router.post("/",[authJwt.verifyToken], meals.createWithUpload);
  
    // Retrieve all Meal
    router.get("/",[authJwt.verifyToken], meals.findAll);
  
    // Retrieve a single Meal with id
    router.get("/recent/:numb", [authJwt.verifyToken,authJwt.isAdmin], meals.findLast);
    
    // Retrieve a single Meal with id
    router.get("/:id", [authJwt.verifyToken], meals.findOne);
  
    // Update a Meal with id
    router.put("/:id", [authJwt.verifyToken], meals.updateWithUpload);
  
    // Delete a Meal with id
    router.delete("/:id", [authJwt.verifyToken], meals.delete);
  
    // Create a new Meal
    router.delete("/", [authJwt.verifyToken], meals.deleteAll);
  
    app.use('/api/meal', router);
  };
