const express = require('express');
const router = express.Router();
// data model
const User = require('../../models/mongoose/user');

// @GET /api/library/favorites
router.get("/favorites", (req, res) => {
    User.find({ "_id": req.payload.userData._id })
        .select('favorites')
        .populate('favorites')
        .then(favorites => {
            res.status(200).json(favorites)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @PATCH /api/library/favorites/
router.post("/favorites", (req, res) => {
    User.findOneAndUpdate({ _id: req.payload.userData._id }, { $addToSet: { favorites: req.body.quizId } }, { new: true })
        .then((user) => {
            res.status(200).json({
                message: 'favorite successful',
                user,
                isFavorited: true
            });
        })
        .catch(function(err) {
            res.status(500).json({
                message: 'favorite failed',
                err,
                isFavorited: false
            });
        });

});

// @PATCH /api/library/favorites/:quizId
router.delete("/favorites/:quizId", (req, res) => {
    User.findOneAndUpdate({ _id: req.payload.userData._id }, { $pull: { favorites: req.params.quizId } }, { new: true })
        .then((user) => {
            res.status(200).json({
                message: 'delete successful',
                user,
                isDeleted: true
            });
        })
        .catch((err) => {
            res.status(500).json({
                message: 'delete failed',
                err,
                isDeleted: false
            });
        });
});

// @GET /api/library/shared/
router.get("/shared", (req, res) => {
    User.find({ "_id": req.payload.userData._id })
        .select('shared')
        .populate('shared')
        .then(shared => {
            res.status(200).json(shared)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @PATCH /api/library/shared/
router.post("/shared/", (req, res) => {
    User.findOneAndUpdate({ email: req.body.email }, { $addToSet: { shared: req.body.quizId } }, { new: true })
        .then((user) => {
            if (!user) {
                res.status(400).json({
                    message: 'share failed',
                    err: 'email does not exist',
                    isShared: false
                });
            } else {
                res.status(200).json({
                    message: 'share successful',
                    user,
                    isShared: true
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: 'share failed',
                err,
                isShared: false
            });
        });
});

// @PATCH /api/library/shared/:quizId
router.delete("/shared/:quizId", (req, res) => {
    User.findOneAndUpdate({ _id: req.payload.userData._id }, { $pull: { shared: req.params.quizId } }, { new: true })
        .then((user) => {
            res.status(200).json({
                message: 'delete successful',
                user,
                isDeleted: true
            });
        })
        .catch((err) => {
            res.status(500).json({
                message: 'delete failed',
                err,
                isDeleted: false
            });
        });
});

module.exports = router;