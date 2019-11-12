const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const config = require('config')
const expressHandlebars = require('express-handlebars')

const rootDir = require('./util/path')
const userRoutes = require('./routes/api/users')
const quizRoutes = require('./routes/api/quizzes')
const errorController = require('./controllers/error')

const app = express();
const server = require('http').Server(app);
const PORT = process.env.PORT || 3000;

// handlebars config
app.engine('hbs', expressHandlebars({
    defaultLayout: 'main',
    layoutDir: path.join(rootDir, 'views/layouts'),
    partialsDir: path.join(rootDir, 'views/partials'),
    extname: '.hbs'
}))
app.set('view engine', 'hbs')
app.set('views', rootDir + '/views')

// DB config
const db = config.get('mongoURI');

// body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static folder
app.use(express.static(path.join(rootDir, 'public')));

// api
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);

// routes
app.use(require('./routes/quizzes'));
app.use('/reports', require('./routes/reports'));
app.use('/games', require('./routes/games'));

// handle unspecified routes
app.use(errorController.get404);

// database, server, socket.io config
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected...')

        server.listen(PORT, () => {
            console.log(`Server started on port ${PORT}...`);
        });

        const io = require('./models/socket').init(server, () => {
            console.log('Socket.io connected...');
        });
        const rootSocket = require('./sockets/index')(io);
    })
    .catch(err => console.log(err))





// const hosterReport = new HosterReport({
//     _id: mongoose.Types.ObjectId(),
//     socket_id: "123456",
//     game_id: "778899",
//     hoster: "5dc33571a29ff70c2073650c",
//     game_name: "game name",
//     questions: [{
//         question_id: "5db543067f76642720c0fea8",
//         question_num: 1,
//         question: "What/'s new at Kahoot! this fall?",
//         choices: [{
//                 choice_id: "5db543067f76642720c0feac",
//                 choice_num: "1",
//                 choice: "The kahoot creator is updated!",
//                 is_correct: true
//             },
//             {
//                 choice_id: "5db543067f76642720c0feab",
//                 choice_num: "2",
//                 choice: "You can now teach full lessons with Kahoot!",
//                 is_correct: true
//             },
//             {
//                 choice_id: "5db543067f76642720c0feaa",
//                 choice_num: "3",
//                 choice: "A question bank with over 500 million questions was added to Kahoot!",
//                 is_correct: true
//             },
//             {
//                 choice_id: "5db543067f76642720c0fea9",
//                 choice_num: "4",
//                 choice: "Kahoot! started a music streaming service.",
//                 is_correct: true
//             }
//         ]
//     }]
// });

// hosterReport.save()
//     .then((report) => {
//         console.log(report)
//     })
//     .catch(err => {
//         console.log(err)
//     });