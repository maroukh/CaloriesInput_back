const { json } = require("body-parser");
const db = require("../models");
const uploadFile = require("../middlewares/upload");
const Meal = db.meal;
const fs = require('fs')

// Create and Save a new Meal
exports.create = (req, res) => {
    // Validate request
    console.log("********** req: " + req.description);
    if (!req.body.title || !req.body.description) {
        console.log("Content can not be empty!");
        console.log(req.body);
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    // Create a Meal
    const meal = new Meal({
        title: req.body.title,
        description: req.body.description,
        calories: req.body.calories,
        dateTimeOfMeal: req.body.dateTimeOfMeal,
        user: req.userId
    });
    console.log("************************* meal: " + meal);
    console.log("req.userId: " + req.userId);


    meal.save((err, meal) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        res.send({ message: "Meal was added successfully!" });
    });
};


exports.createWithUpload = async (req, res) => {

    try {
        await uploadFile(req, res);
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }
        console.log("************************* 1");
        console.log("************************* filename: " + req.file.filename);
        console.log("************************* file.path: " + req.file.path);
        if (!req.body.title || !req.body.description) {
            console.log("Content can not be empty!");
            console.log(req.body);
            res.status(400).send({ message: "Content can not be empty!" });
            return;
        }
        console.log("************************* 2");
        // Create a Meal
        const meal = new Meal({
            title: req.body.title,
            description: req.body.description,
            calories: req.body.calories,
            dateTimeOfMeal: req.body.dateTimeOfMeal,
            fileUrl: "http://localhost:8080/api/files/get/" + req.file.filename,
            fileName: req.file.filename,
            user: req.userId
        });
        console.log("************************* 3");
        console.log("************************* meal: " + meal);
        console.log("req.userId: " + req.userId);

        meal.save((err, meal) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            console.log("************************* 4");

            res.send({ message: "Meal was added successfully!" });
            return;
        });
        console.log("************************* 6");
    } catch (err) {
        console.log(err);
        console.log("************************* 7");
        if (err.code == "LIMIT_FILE_SIZE") {
            return res.status(500).send({
                message: "File size cannot be larger than 2MB!",
            });
        }
        console.log("************************* 8");
        res.status(500).send({
            message: `Could not upload the file: ${req.file.originalname}. ${err}`,
        });
    }
};


// Retrieve all Meals/ find by title from the database
exports.findAll = (req, res) => {
    console.log(" Debut findAll  ...............................................");
    const userId = req.userId
    const userRoles = req.userRoles;
    console.log("######################: " + userId);
    console.log("######################: " + userRoles);
    let userCondition = { user: userId };
    for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].name === "admin") {
            userCondition = {};
        }
    }
    const title = req.query.title;
    const titleCondition = title ? { title: { $regex: new RegExp(title), $options: "i" } } : {};
    const condition = { ...userCondition, ...titleCondition }

    Meal.find(condition).populate("user", "-__v")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Meals."
            });
        });

    console.log(" Fin findAll  ...............................................");
};

// Find a single Meal with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Meal.findById(id).populate("user", "-__v")
        .then(data => {
            if (!data)
                res.status(404).send({ message: "Not found Meal with id " + id });
            else res.send(data);
        })
        .catch(err => {
            console.log(err);
            res
                .status(500)
                .send({ message: err.message });
        });
};

// Find a single Meal with an id
exports.findLast = (req, res) => {
    console.log("------------- findLast");
    let numb = req.params.numb;
    console.log("------------- numb:"+numb);
    if(!numb) numb = 4;
    Meal.find({}).sort({ _id: -1 }).limit(parseInt(numb)).populate("user", "-__v")
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            console.log("------------- err:"+err);
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Meals."
            });
        });
};

// Update a Meal by the id in the request
exports.update = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    const id = req.params.id;

    Meal.findByIdAndUpdate(id, req.body, { useFindAndModify: false }).populate("user", "-__v")
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot update Meal with id=${id}. Maybe Meal was not found!`
                });
            } else res.send({ message: "Meal was updated successfully." });
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating Meal with id=" + id
            });
        });
};

// Update a Meal by the id in the request
exports.updateWithUpload = async (req, res) => {
    console.log("Debut Update ...............................................");
    try {
        await uploadFile(req, res);
        console.log("Uplaoding File ...............................................");
        if (req.file != undefined) {
            //return res.status(400).send({ message: "Please upload a file!" });
            req.body.fileUrl = "http://localhost:8080/api/files/get/" + req.file.filename;
            req.body.fileName = req.file.filename;
            console.log("************************* 1");
            console.log("************************* filename: " + req.file.filename);
            console.log("************************* file.path: " + req.file.path);
        }
    } catch (err) {
        console.log(err);
        if (err.code == "LIMIT_FILE_SIZE") {
            return res.status(500).send({
                message: "File size cannot be larger than 2MB!",
            });
        }
        res.status(500).send({
            message: `Could not upload the file  ${err}`,
        });
    }


    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    const id = req.params.id;
    console.log("-------------------------id",req.body);
    delete req.body.user;

    Meal.findByIdAndUpdate(id, req.body, { useFindAndModify: false }).populate("user", "-__v")
        .then(data => {
            console.log(data);
            if (!data) {
                res.status(404).send({
                    message: `Cannot update Meal with id=${id}. Maybe Meal was not found!`
                });
            } else res.send({ message: "Meal was updated successfully." });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({
                message: err.message
            });
        });

    console.log("Fin Update ...............................................");

};

// Delete a Meal with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    Meal.findByIdAndRemove(id)
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot delete Meal with id=${id}. Maybe Meal was not found!`
                });
            } else {
                const directoryPath = __basedir + "/resources/static/assets/uploads/";
                try {
                    fs.unlinkSync(directoryPath + data.fileName);
                    //file removed
                    res.send({
                        message: "Meal was deleted successfully!"
                    });
                } catch (err) {
                    console.error(err)
                }
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete Meal with id=" + id
            });
        });
};

// Delete all Meals from the database.
exports.deleteAll = (req, res) => {
    Meal.deleteMany({})
        .then(data => {
            res.send({
                message: `${data.deletedCount} Meals were deleted successfully!`
            });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while removing all Meals."
            });
        });
};
