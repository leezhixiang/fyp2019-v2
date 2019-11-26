const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')

// data model
const User = require('../../models/mongoose/user');
const Class = require('../../models/mongoose/class');

// @route   GET /api/classes/
// @desc    view classes
// @access  private
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

// @route   GET /api/classes/:classId
// @desc    view class
// @access  private
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

// @route   POST /api/classes/
// @desc    create class
// @access  private
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

// @route   PATCH /api/classes/:classId
// @desc    edit class
// @access  private, admin only
router.patch("/:classId", (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({
            message: 'update failed',
            err,
            isUpdated: false,
        });
    }

    const updateSetOps = {};
    const updateUnsetOps = {};
    for (const key in req.body) {
        if (req.body[key]) {
            updateSetOps[key] = req.body[key];
        };
        if (req.body[key] === "") {
            updateUnsetOps[key] = req.body[key];
        };
    };

    Class
        .updateOne({
            _id: req.params.classId,
            admin: req.payload.userData._id
        }, {
            $set: updateSetOps,
            $unset: updateUnsetOps
        }, {
            upsert: true
        })
        .then((myClass) => {
            res.status(200).json({
                message: 'update successful',
                myClass,
                isUpdated: true
            });
        }).catch(err => {
            console.log(err);
            res.status(400).json({
                message: 'update failed',
                err,
                isUpdated: false,
            });
        })
});

// @route   DELETE /api/classes/:classId
// @desc    delete class
// @access  private, admin only
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