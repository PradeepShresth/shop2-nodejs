const path = require('path')
const fs = require('fs');

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer');
const csrf = require('csurf');
const flash = require('connect-flash');

const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const User = require('./models/user');

const errorController = require('./controllers/error');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-6xf92.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'session'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        const name = new Date().toISOString().replace(':', '-').replace(':', '-').replace('.', '-');
        cb(null, name + '--' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access-log'),
    { flags: 'a' }
)

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.urlencoded({extended: true}));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}))

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        console.log(err);
    })
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        MONGODB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
    )
    .then(result => {
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {
        console.log(err);
    });