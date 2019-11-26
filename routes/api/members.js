const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')

// data model
const User = require('../../models/mongoose/user');
const Class = require('../../models/mongoose/class');

// @route   POST /api/members/
// @desc    create class
// @access  private
router.post("/", (req, res) => {
    if (!req.body.class_id) {
        return res.status(400).json({
            message: 'join failed',
            err: 'class_id is required',
            isUpdated: false,
        });
    }

    Class
        .updateOne({
            class_id: req.body.class_id,
        }, {
            $addToSet: { members: req.payload.userData._id },
        })
        .then((myClass) => {
            res.status(200).json({
                message: 'join successful',
                myClass,
                isUpdated: true
            });
        }).catch(err => {
            console.log(err);
            res.status(400).json({
                message: 'join failed',
                err,
                isUpdated: false,
            });
        })
});

// @route   DELETE /api/members/:classId
// @desc    exit class
// @access  private, member only
router.delete("/exit/:classId", (req, res) => {
    if (!req.params.classId) {
        return res.status(400).json({
            message: 'exit failed',
            err: 'class_id is required',
            isUpdated: false,
        });
    }

    Class.updateOne({ class_id: req.params.classId }, {
            $pull: { members: req.payload.userData._id },
        })
        .then((myClass) => {
            res.status(200).json({
                message: 'exit successful',
                myClass,
                isUpdated: true
            });
        }).catch(err => {
            console.log(err);
            res.status(400).json({
                message: 'exit failed',
                err,
                isUpdated: false,
            });
        })
});

// @route   DELETE /api/members/:classId
// @desc    remove member
// @access  private, admin only
router.delete("/remove/:userId", (req, res) => {
    if (!req.params.userId) {
        return res.status(400).json({
            message: 'remove failed',
            err,
            isUpdated: false,
        });
    };

    Class.updateOne({ class_id: req.body.class_id, admin: req.payload.userData._id }, {
            $pull: { members: req.params.userId },
        })
        .then((myClass) => {
            console.log(myClass)
            res.status(200).json({
                message: 'remove successful',
                myClass,
                isUpdated: true
            });
        }).catch(err => {
            console.log(err);
            res.status(400).json({
                message: 'remove failed',
                err,
                isUpdated: false,
            });
        });
});

module.exports = router;