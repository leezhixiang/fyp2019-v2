// data model
const Class = require('../models/mongoose/class');

exports.addNewMember = (req, res) => {
    if (!req.body.class_id) {
        return res.status(400).json({
            message: 'join failed',
            err: 'class_id is required',
            isUpdated: false,
        });
    };

    Class.findOne({
            class_id: req.body.class_id,
            $or: [
                { admins: { "$in": [req.payload.userData._id] } },
                { members: { "$in": [req.payload.userData._id] } }
            ]
        })
        .then(myClass => {
            if (myClass) {
                return res.status(400).json({
                    message: 'join failed',
                    err: 'Already joined in class.',
                    isUpdated: false,
                });
            };


            Class.updateOne({ class_id: req.body.class_id }, {
                    $addToSet: { members: req.payload.userData._id }
                })
                .then((result) => {
                    console.log(result)
                    if (result.nModified === 0) {
                        return res.status(400).json({
                            message: 'join failed',
                            err: 'Invalid class code.',
                            isUpdated: false,
                        });
                    };

                    res.status(200).json({
                        message: 'join successful',
                        result,
                        isUpdated: true
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: 'join failed',
                err,
                isUpdated: false,
            });
        });
};

exports.removeExitClassMember = (req, res) => {
    if (!req.body.class_id) {
        return res.status(400).json({
            message: 'exit failed',
            err: 'class_id is required',
            isUpdated: false,
        });
    };

    Class.findOne({
            class_id: req.body.class_id,
            members: { "$in": [req.payload.userData._id] }
        })
        .then(myClass => {
            if (!myClass) {
                return res.status(400).json({
                    message: 'exit failed',
                    err: 'member not in class',
                    isUpdated: false,
                });
            }
            Class.updateOne({ class_id: req.body.class_id, }, {
                    $pull: { members: req.payload.userData._id },
                })
                .then((result) => {
                    res.status(200).json({
                        message: 'exit successful',
                        result,
                        isUpdated: true
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: 'exit failed',
                err,
                isUpdated: false,
            });
        });
};

exports.removeMember = (req, res) => {
    if (!req.body.class_id) {
        return res.status(400).json({
            message: 'remove failed',
            err: 'class_id is required',
            isUpdated: false,
        });
    };
    Class.findOne({
            class_id: req.body.class_id,
            admins: { "$in": [req.payload.userData._id] }
        })
        .then(myClass => {
            if (!myClass) {
                return res.status(403).json({
                    message: 'remove failed',
                    err: 'Forbidden',
                    isUpdated: false,
                });
            };

            Class.updateOne({
                    class_id: req.body.class_id,
                    admins: { "$in": [req.payload.userData._id] }
                }, {
                    $pull: { members: req.params.userId },
                })
                .then((result) => {
                    res.status(200).json({
                        message: 'remove successful',
                        result,
                        isUpdated: true
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: 'remove failed',
                err,
                isUpdated: false,
            });
        });
};