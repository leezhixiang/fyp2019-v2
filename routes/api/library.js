const express = require('express');
const router = express.Router();
// data model
const User = require('../../models/mongoose/user');
const Favorite = require('../../models/mongoose/favorite');
const Share = require('../../models/mongoose/share');

// @GET /api/library/favorites/
router.get("/favorites", (req, res) => {
    Favorite.find({ "user_id": req.payload.userData._id })
        .select('quiz_id')
        .populate('quiz_id')
        .then(favorite => {
            res.status(200).json(favorite)
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// @POST /api/library/favorites/ 
router.post("/favorites", (req, res) => {
    Favorite.findOne({ user_id: req.payload.userData._id, quiz_id: req.body.quizId })
        .then((favorite) => {
            if (!favorite) {
                const favorite = new Favorite({
                    user_id: req.payload.userData._id,
                    quiz_id: req.body.quizId
                });
                favorite.save()
                    .then((favorite) => {
                        res.status(200).json({
                            message: 'favorite successful',
                            favorite,
                            isFavorited: true,
                        });
                    });
            } else {
                res.status(400).json({
                    message: 'favorite failed',
                    err: 'favorite already exists',
                    isFavorited: false
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: 'favorite failed',
                err: err.message,
                isFavorited: false
            });
        })
});

// @DELETE /api/library/favorites/:quizId
router.delete("/favorites/:quizId", (req, res) => {
    Favorite.findOneAndDelete({ user_id: req.payload.userData._id, quiz_id: req.params.quizId })
        .then((favorite) => {
            res.status(200).json({
                message: 'delete successful',
                favorite,
                isDeleted: true
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                message: 'delete failed',
                err: err.message,
                isDeleted: false,
            });
        });
});

// @GET /api/library/shared/
router.get("/shared", (req, res) => {
    Share.find({ "user_id": req.payload.userData._id })
        .select('quiz_id')
        .populate('quiz_id')
        .then(share => {
            res.status(200).json(share)
        })
        .catch(err => {
            002
            res.status(500).json(err);
        });
});

// @POST /api/library/shared/
router.post("/shared/", (req, res) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                res.status(400).json({
                    message: 'share failed',
                    err: 'user account does not exist',
                    isShared: false
                });
            } else {
                const share = new Share({
                    user_id: user._id,
                    quiz_id: req.body.quizId
                });
                share.save()
                    .then((share) => {
                        res.status(200).json({
                            message: 'share successful',
                            share,
                            isShared: true,
                        });
                    });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                message: 'share failed',
                err: err.message,
                isShared: false
            });
        })
});

// @DELETE /api/library/shared/:quizId
router.delete("/shared/:quizId", (req, res) => {
    Share.findOneAndDelete({ user_id: req.payload.userData._id, quiz_id: req.params.quizId })
        .then((share) => {
            res.status(200).json({
                message: 'delete successful',
                share,
                isDeleted: true
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                message: 'delete failed',
                err: err.message,
                isDeleted: false,
            });
        });
});

module.exports = router;