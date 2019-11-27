const express = require('express');
const router = express.Router();

const notification_io = require('../../models/socket');

// data model
const OnlineUser = require('../../models/user');

const Quiz = require('../../models/mongoose/quiz');
const User = require('../../models/mongoose/user');
const Favorite = require('../../models/mongoose/favorite');
const Share = require('../../models/mongoose/share');
const Notification = require('../../models/mongoose/notification');

// @route   GET /api/library/favorites/
// @desc    get all favorites
// @access  private
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

// @route   POST /api/library/favorites/ 
// @desc    favorite quiz
// @access  private
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

// @route   DELETE /api/library/favorites/:quizId
// @desc    unfavorite quiz
// @access  private
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

// @route   GET /api/library/shared/
// @desc    get shared quizzes
// @access  private
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

// @route   POST /api/library/shared/
// @desc    share quiz
// @access  private
router.post("/shared/", (req, res) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({
                    message: 'share failed',
                    err: 'user account does not exist',
                    isShared: false
                });
            };

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

            Quiz.findById(req.body.quizId)
                .select('title')
                .then(quiz => {
                    // save notification to the recipient
                    const notification = new Notification({
                        recipient_id: user._id,
                        sender_id: req.payload.userData._id,
                        type: 'SHARE QUIZ',
                        content: `${req.payload.userData.name} shared you a quiz: "${quiz.title}"`,
                        isRead: false
                    });

                    notification.save((err) => {
                        if (err) {
                            console.log(err);
                            return;
                        };
                        console.log(`[@hoster host-game] mongoDB responses success`);
                    });

                    // send notification to all members in class
                    const users = OnlineUser.getUsers();

                    const onlineUsers = users.filter(u => u.userId.equals(user._id));

                    onlineUsers.forEach((onlineUser) => {
                        // sending to individual socketid (private message)
                        notification_io.getNotificationIO().to(`${onlineUser.socketId}`).emit('new-notification', notification.content);
                    });
                })
                .catch(err => {
                    console.log(err);
                });
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

// @route   DELETE /api/library/shared/:quizId
// @desc    delete shared quiz
// @access  private
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