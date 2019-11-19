const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const config = require('config')
const expressHandlebars = require('express-handlebars')
const checkAuth = require('./middleware/check-auth');

const rootDir = require('./util/path');
const userRoutes = require('./routes/api/users');
const quizRoutes = require('./routes/api/quizzes');
const libraryRoutes = require('./routes/api/library');
const reportRoutes = require('./routes/api/reports');
const errorController = require('./controllers/error');

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
app.use('/api/library', checkAuth, libraryRoutes);
app.use('/api/reports', checkAuth, reportRoutes);

// routes
app.use(require('./routes/quizzes'));
app.use('/reports', require('./routes/reports'));
app.use('/games', require('./routes/games'));
app.use('/users', require('./routes/users'));

// handle unspecified routes
app.use(errorController.get404);

// database, server, socket.io config
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        console.log('MongoDB connected...')

        server.listen(PORT, () => {
            console.log(`Server started on port ${PORT}...`);
        });

        const io = require('./models/socket').init(server, () => {
            console.log('Socket.io connected...');
        });
        const rootSocket = require('./sockets/index')();
    })
    .catch(err => console.log(err))