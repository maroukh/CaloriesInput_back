const db = require("../models");
var bcrypt = require("bcryptjs");
const json = require("body-parser/lib/types/json");
const uploadFile = require("../middlewares/upload");
const User = db.user
const Role = db.role
const Meal = db.meal;

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
};

exports.updateUserImage = async (req, res) => {
    const id = req.params.id;
    try {
        await uploadFile(req, res);
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }
        var fileUrl = "https://inputcalories.herokuapp.com/api/files/get/" + req.file.filename;
        var fileName = req.file.filename;
        console.log("req.userId: " + id);
        //check modification of password
        User.findById(id).exec((err, user2) => {
            if (err) {
                console.log("err: " + err);
                res.status(500).send({ message: err });
                return;
            }
            if (user2) {
                user2.fileUrl = fileUrl;
                user2.filename = fileName;
                User.findByIdAndUpdate(id, user2, { useFindAndModify: false })
                    .then(data => {
                        if (!data) {
                            res.status(404).send({
                                message: `Cannot update User with id=${id}. Maybe User was not found!`
                            });
                        } else res.send({ message: "User was updated successfully." });
                    })
                    .catch(err => {
                        console.log("err: " + err);
                        res.status(500).send({
                            message: "Error updating User with id=" + id
                        });
                    });
            }
        });


    } catch (err) {
        console.log(err);
        console.log("************************* 7");
        if (err.code == "LIMIT_FILE_SIZE") {
            return res.status(500).send({
                message: "File size cannot be larger than 2MB!",
            });
        }
        res.status(500).send({
            message: `Could not upload the file: ${req.file.originalname}. ${err}`,
        });
    }
};

// Create and Save a new User
exports.create = (req, res) => {
    // Validate request
    if (!req.body.email || !req.body.password || !req.body.username || !req.body.expectedcalories) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    //check existing user
    User.findOne({
        email: req.body.email,
        issocial: req.body.issocial
    }).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (user) {
            res.status(404).send({ message: "User Already exist." });
            return;
        }
    });



    // Create a User
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        issocial: req.body.issocial,
        expectedcalories: req.body.expectedcalories
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
                        return;
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
                    return;
                });
            });
        }
    });
};


// Retrieve all Users
exports.findAll = (req, res) => {
    User.find().populate("roles", "-__v")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Users."
            });
        });
};

// Retrieve Last Users
exports.findDashInfo = (req, res) => {
    console.log("findDashInfo....");
    let dash = {
        nManager: 0,
        nUser: 0,
        nMeals: 0
    }
    User.find().populate("roles", "-__v")
        .then(data => {
            console.log("findDashInfo.... User.findAll");
            Meal.countDocuments({}, function (err, mealCount) {
                console.log("findDashInfo.... User.findAll");
                dash.nMeals = mealCount;
                dash.nUser = data.filter(user => {
                    return user.roles.map(role => role.name).includes("user");
                }).length;
                dash.nManager = data.filter(user => {
                    return user.roles.map(role => role.name).includes("manager");
                }).length;
                console.log("findDashInfo.... sending Data");
                res.send(dash);
            });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Users."
            });
        });
};

// Retrieve Last Users
exports.findLast = (req, res) => {
    let numb = req.params.numb;
    if (!numb) numb = 4;
    User.find().sort({ _id: -1 }).limit(parseInt(numb)).populate("roles", "-__v")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Users."
            });
        });
};

// Find a single User with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    User.findById(id).populate("roles", "-__v")
        .then(data => {
            if (!data)
                res.status(404).send({ message: "Not found User with id " + id });
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving User with id=" + id });
        });
};

// Update a User by the id in the request
exports.update = (req, res) => {
    console.log("update........................................ ");
    if (!req.body.email || !req.body.password || !req.body.username || !req.body.expectedcalories) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    const id = req.params.id;
    // update a User
    const user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        issocial: req.body.issocial,
        expectedcalories: req.body.expectedcalories
    };

    //check modification of password
    User.findById(id).exec((err, user2) => {
        if (err) {
            console.log("err: " + err);
            res.status(500).send({ message: err });
            return;
        }
        if (user2) {
            if (user2.password != req.body.password) user.password = bcrypt.hashSync(req.body.password, 8);
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
                        user.roles = roles;
                        User.findByIdAndUpdate(id, user, { useFindAndModify: false })
                            .then(data => {
                                if (!data) {
                                    res.status(404).send({
                                        message: `Cannot update User with id=${id}. Maybe User was not found!`
                                    });
                                } else res.send({ message: "User was updated successfully." });
                            })
                            .catch(err => {
                                console.log("err: " + err);
                                res.status(500).send({
                                    message: "Error updating User with id=" + id
                                });
                            });
                    }
                );
            } else {
                Role.findOne({ name: "user" }, (err, role) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                    user.roles = [role];
                    User.findByIdAndUpdate(id, user, { useFindAndModify: false })
                        .then(data => {
                            if (!data) {
                                res.status(404).send({
                                    message: `Cannot update User with id=${id}. Maybe User was not found!`
                                });
                            } else res.send({ message: "User was updated successfully." });
                        })
                        .catch(err => {
                            console.log("err: " + err);
                            res.status(500).send({
                                message: "Error updating User with id=" + id
                            });
                        });
                });
            }



        }
    });
    /********************************************************************* */

};

// Update a User's expectedCalories by the id in the request
exports.updateExpectedCalories = (req, res) => {
    console.log("updateExpectedCalories........................................ " + JSON.stringify(req.body));
    if (!req.body.updatedExpectedCalories) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const id = req.params.id;
    //check modification of password
    User.findById(id).exec((err, user2) => {
        if (err) {
            console.log("err: " + err);
            res.status(500).send({ message: err });
            return;
        }
        if (user2) {
            user2.expectedcalories = req.body.updatedExpectedCalories;
            User.findByIdAndUpdate(id, user2, { useFindAndModify: false })
                .then(data => {
                    if (!data) {
                        res.status(404).send({
                            message: `Cannot update User with id=${id}. Maybe User was not found!`
                        });
                    } else res.send({ message: "User was updated successfully." });
                })
                .catch(err => {
                    console.log("err: " + err);
                    res.status(500).send({
                        message: "Error updating User with id=" + id
                    });
                });
        }
    });
};

// Delete a Meal with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    User.findByIdAndRemove(id)
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot delete User with id=${id}. Maybe User was not found!`
                });
            } else {
                res.send({
                    message: "User was deleted successfully!"
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete User with id=" + id
            });
        });
};

// Delete all Meals from the database.
exports.deleteAll = (req, res) => {
    User.deleteMany({})
        .then(data => {
            res.send({
                message: `${data.deletedCount} Users were deleted successfully!`
            });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while removing all Users."
            });
        });
};