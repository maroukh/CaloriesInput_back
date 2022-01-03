const { authJwt } = require("../middlewares");
const userController = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", userController.allAccess);

  app.get("/api/test/user", [authJwt.verifyToken], userController.userBoard);

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isUserManager],
    userController.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    userController.adminBoard
  );

  // Create a new User
  app.post("/api/user/",[authJwt.verifyToken, authJwt.isUserManager], userController.create);
  
  // Retrieve all Users
  app.get("/api/user/",[authJwt.verifyToken, authJwt.isUserManager], userController.findAll);

  // Retrieve a single Meal with id
  app.get("/api/user/dashinfo", [authJwt.verifyToken,authJwt.isAdmin], userController.findDashInfo);
  
  // Retrieve a single User with id
  app.get("/api/user/:id", [authJwt.verifyToken, authJwt.isUserManager], userController.findOne);

  // Retrieve a single Meal with id
  app.get("/api/user/recent/:numb", [authJwt.verifyToken,authJwt.isAdmin], userController.findLast);

  // Update a User with id
  app.put("/api/user/:id", [authJwt.verifyToken, authJwt.isUserManager], userController.update);

  // Update Image a User with id
  app.put("/api/user/imageUpdate/:id", [authJwt.verifyToken], userController.updateUserImage);

  // Update a User with id
  app.put("/api/user/expectedcalories/:id", [authJwt.verifyToken], userController.updateExpectedCalories);

  // Delete a User with id
  app.delete("/api/user/:id", [authJwt.verifyToken, authJwt.isUserManager], userController.delete);

  // Create a new User
  app.delete("/api/user/", [authJwt.verifyToken, authJwt.isUserManager], userController.deleteAll);

};