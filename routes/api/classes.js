const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')

// data model
const User = require('../../models/mongoose/user');
const Class = require('../../models/mongoose/class');

// @GET /api/classes/
router.get("/", (req, res) => {
    Class
        .find({ admin: req.payload.userData._id })
        .populate('admin', 'name')
        .then(myClass => {
            res.status(200).json(myClass)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @GET /api/classes/:classId
router.get("/:classId", (req, res) => {
    Class.findOne({ _id: req.params.classId, admin: req.payload.userData._id })
        .populate('admin', 'name')
        .then(myClass => {
            res.status(200).json(myClass)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @POST /api/classes/
router.post("/", (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({
            message: 'create failed',
            err: 'name is required',
            isCreated: false
        });
    }

    const createOps = {};
    for (const key in req.body) {
        if (req.body[key]) {
            createOps[key] = req.body[key];
        };
    };

    generateUID = () => {
        let firstPart = (Math.random() * 46656) | 0;
        let secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    };

    createOps.class_id = generateUID();
    createOps.admin = req.payload.userData._id;

    const myClass = new Class(createOps);

    console.log(myClass);

    myClass.save()
        .then((myClass) => {
            res.status(200).json({
                message: 'create successful',
                myClass,
                isCreated: true,
            });
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({
                message: 'create failed',
                err,
                isCreated: false,
            });
        });
});

// @PATCH /api/classes/:classId
router.patch("/:classId", (req, res) => {

});

// @DELETE /api/classes/:classId
router.delete("/:classId", (req, res) => {
    Class.findOneAndDelete({ _id: req.params.classId, admin: req.payload.userData._id })
        .then((myClass) => {
            res.status(200).json({
                message: 'delete successful',
                myClass,
                isDeleted: true
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                message: 'delete failed',
                err,
                isDeleted: false,
            });
        });
});

module.exports = router;