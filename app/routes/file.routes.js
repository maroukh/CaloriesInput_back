module.exports = app => {
  const { authJwt } = require("../middlewares");
  const express = require("express");
  const router = express.Router();
  const fileController = require("../controllers/file.controller");

  router.post("/upload", [authJwt.verifyToken], fileController.upload);
  router.get("", [authJwt.verifyToken], fileController.getListFiles);
  router.get("/:name", fileController.download);
  router.get('/get/:name', fileController.getImage);
  app.use('/api/files', router);
};
