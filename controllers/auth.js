const bcrypt = require('bcryptjs');

const { validationResult } = require('express-validator');

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
          username: '',
          password: ''
        },
        validationErrors: []
    })
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/register', {
        pageTitle: 'Register',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    })
}

exports.postSignup = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/register.ejs', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                username: username,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
        const user = new User ({
            username: username,
            email: email,
            password: hashedPassword
        })
        return user.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        console.log(err);
    });
}

exports.postLogin = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const errors = validationResult(req);

    User.findOne({ username: username })
    .then(user => {
        if (!user) {
            return res.status(422).render('auth/login.ejs', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid username!!',
                oldInput: {
                    username: username,
                    password: password
                },
                validationErrors: []
            });
        }
        bcrypt.compare(password, user.password)
        .then(doMatch => {
            if(doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err => {
                    console.log(err);
                    res.redirect('/');
                })
            }
            return res.status(422).render('auth/login.ejs', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid password.',
                oldInput: {
                  username: username,
                  password: password
                },
                validationErrors: []
            });
        })
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    })
}