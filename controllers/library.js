// socket.io
const notification_io = require('../models/socket');

// data model
const User = require('../models/mongoose/user');
const Quiz = require('../models/mongoose/quiz');
const Favorite = require('../models/mongoose/favorite');
const Share = require('../models/mongoose/share');
const Notification = require('../models/mongoose/notification');

const OnlineUser = require('../models/user');

exports.getFavoritedQuizzes = (req, res) => {
    Favorite.find({ "user_id": req.payload.userData._id })
        .select('quiz_id')
        .populate({
            path: 'quiz_id',
            populate: {
                path: 'creator',
                select: 'name'
            }
        })
        .then(favorite => {
            res.status(200).json(favorite)
        })
        .catch(err => {
            res.status(500).json(err);
        });
};

exports.addFavoritedQuiz = (req, res) => {
    Favorite.findOne({ user_id: req.payload.userData._id, quiz_id: req.body.quizId })
        .then((favorite) => {
            // if the quiz is already favorited
            if (favorite) {
                return res.status(500).json({
                    message: 'favorite failed',
                    err: 'favorite already exists',
                    isFavorited: false
                })
            };

            const newFavorite = new Favorite({
                user_id: req.payload.userData._id,
                quiz_id: req.body.quizId
            });

            newFavorite.save()
                .then((favorite) => {
                    res.status(201).json({
                        message: 'favorite successful',
                        favorite,
                        isFavorited: true,
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        message: 'favorite failed',
                        err,
                        isFavorited: false
                    });
                });
        })
        .catch((err) => {
            res.status(500).json({
                message: 'favorite failed',
                err: err.message,
                isFavorited: false
            });
        });
};

exports.removeFavoritedQuiz = (req, res) => {
    Favorite.deleteOne({ user_id: req.payload.userData._id, quiz_id: req.params.quizId })
        .then((result) => {
            res.status(200).json({
                message: 'delete successful',
                result,
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
};

exports.getSharedQuizzes = (req, res) => {
    Share.find({ "user_id": req.payload.userData._id })
        .select('_id')
        .select('quiz_id')
        .populate('quiz_id')
        .then(sharedQuizzes => {
            res.status(200).json(sharedQuizzes)
        })
        .catch(err => {
            002
            res.status(500).json(err);
        });
};

exports.addSharedQuiz = (req, res) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(400).json({
                    message: 'share failed',
                    err: 'recipient account does not exist',
                    isShared: false
                });
            };

            if (user._id.equals(req.payload.userData._id)) {
                return res.status(400).json({
                    message: 'share failed',
                    err: 'share to oneself is not allowed',
                    isShared: false
                });
            };

            const share = new Share({
                user_id: user._id,
                quiz_id: req.body.quizId
            });

            share.save()
                .then((share) => {
                    res.status(201).json({
                        message: 'share successful',
                        share,
                        isShared: true,
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        message: 'share failed',
                        err,
                        isShared: false
                    });
                });

            // save notification to the recipient
            Quiz.findById(req.body.quizId)
                .select('title')
                .then(quiz => {
                    const notification = new Notification({
                        recipient_id: user._id,
                        sender_id: req.payload.userData._id,
                        type: 'SHARE QUIZ',
                        content: `${req.payload.userData.name} shared you a quiz: "${quiz.title}"`,
                        isRead: false
                    });

                    notification.save()
                        .then(() => {
                            console.log(`[@hoster host-game] mongoDB responses success`);
                        })
                        .catch((err) => {
                            console.log(err);
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
                err,
                isShared: false
            });
        });
};

exports.deleteSharedQuiz = (req, res) => {
    Share.deleteOne({ _id: req.params.sharedQuizId, user_id: req.payload.userData._id })
        .then((result) => {
            res.status(200).json({
                message: 'delete successful',
                result,
                isDeleted: true
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                message: 'delete failed',
                err,
                isDeleted: false,
            });
        });
}