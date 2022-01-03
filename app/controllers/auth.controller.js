const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    issocial: 0
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email,
    issocial: 0
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id, roles: user.roles }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        expectedcalories: user.expectedcalories,
        fileUrl: user.fileUrl,
        accessToken: token
      });
    });
};

exports.postSocialLogin = (req, res) => {
  User.findOne({
    email: req.body.email,
    issocial: 1
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      console.log("Looking for User: " + user);

      if (!user) {
        console.log("User Not Find: " + req.body.email + " | issocial: 1");
        //return res.status(404).send({ message: "User Not found." });
        //Create new socialUser
        const user = new User({
          username: req.body.username,
          email: req.body.email,
          issocial: 1
        });
        console.log("Saving User: " + user);
        user.save((err, user) => {
          if (err) {
            console.log("Saving User err: " + err);
            res.status(500).send({ message: err });
            return;
          }
          console.log("Saving User OK ");
          Role.findOne({ name: "user" }, (err, role) => {
            if (err) {
              console.log("Saving User err: " + err);
              res.status(500).send({ message: err });
              return;
            }
            console.log("Finding Role " + role);

            user.roles = [role._id];
            user.save(err => {
              if (err) {
                console.log("Saving User err: " + err);
                res.status(500).send({ message: err });
                return;
              }

              //res.send({ message: "User was registered successfully!" });
              console.log("Generating Token ");
              var token = jwt.sign({ id: user.id, roles: user.roles }, config.secret, {
                expiresIn: 86400 // 24 hours
              });

              var authorities = [];
              console.log("user Roles " + user.roles);

              authorities.push("ROLE_" + role.name.toUpperCase());
              res.status(200).send({
                id: user._id,
                username: user.username,
                email: user.email,
                roles: authorities,
                issocial: 1,
                expectedcalories: user.expectedcalories,
                accessToken: token
              });
            });
            console.log("Saving User Roles OK ");
          });

        });
      } else {
        console.log("Generating Token ");
        var token = jwt.sign({ id: user.id, roles: user.roles }, config.secret, {
          expiresIn: 86400 // 24 hours
        });

        var authorities = [];
        console.log("user Roles " + user.roles);
        for (let i = 0; i < user.roles.length; i++) {
          authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user._id,
          username: user.username,
          email: user.email,
          roles: authorities,
          issocial: 1,
          expectedcalories: user.expectedcalories,
          accessToken: token
        });
      }
    });
};