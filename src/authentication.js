/**
 * Login, logout, token, session
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const fs = require("fs"),
    path = require("path"),
    LocalStrategy = require("passport-local").Strategy,
    ObjectID = require('mongodb').ObjectID,
    Speakeasy = require("speakeasy"),
    md5 = require("md5");

module.exports = (_this, settings, app, mongodb, i18n, passport, schema, dirname, wallpapers) => {
    _this.set("isAuthenticated", (req, res, next) => {
        if (req.isAuthenticated()) {
            var now = new Date().getTime();
            try {
                var tokenenabled = req.user.token.enabled || false;
            } catch (e) {
                var tokenenabled = false
            }

            if (tokenenabled && now > (req.user.token.timeout || 0))
                res.redirect(settings.url + schema.routes.authToken);
            else
                next();
        } else {
            if (req.xhr)
                res.status(401).send("Unauthorized");
            else
                res.redirect(settings.url + schema.routes.authLogin);
        }
    });

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        if (id) {
            mongodb.collection(schema.collections.users).findOne({
                $or: [{
                    _id: id
                }, {
                    _id: ObjectID(id)
                }]
            }, (err, user) => {
                if (user) done(null, user);
                else done(err, null)
            });
        } else {
            done("Invalid ID", null);
        }
    });

    app.post(schema.routes.invite, async (req, res) => {
        const { invite, invites } = req.body
        invite._id = invite.token
        try {
            await mongodb.collection(schema.collections.invites).updateOne({ _id: invite._id }, { $set: invite }, { upsert: true })
            if (invites) {
                await mongodb.collection(schema.collections.users).updateOne({ user: invite.user }, {  $set: { invites: invites } }, { upsert: true })
                await res.send(invites)
            } else {
                res.send({ error: false })
            }
        } catch (err) {
            console.log(err)
            res.send({ error: err })
        }
    })

    app.get(schema.routes.register, async (req, res) => {
        const { token } = req.params
        var { user } = req
        if (user) delete user.pass
        try {
            const invite = await mongodb.collection(schema.collections.invites).findOne({ $and: [{_id: token},{invited: ''}] })
            if (invite) {
                var getRandomInt = (min, max) => {
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
                let wallpaper = wallpapers[getRandomInt(0, wallpapers.length - 1)]
                res.render(schema.templates.authLogin, { wallpaper: wallpaper, user: user || {}, invite: invite })
            } else {
                res.redirect(schema.routes.index)
            }
        } catch (err) {
            console.log(err)
            res.redirect(schema.routes.index)
        }
    });

    passport.use('local-login', new LocalStrategy(function (username, password, done) {
        mongodb.collection(schema.collections.users).findOne({
            $or: [{
                user: username
            },
            {
                email: username
            }
            ]
        }, function (err, user) {
            //pass: md5(password)
            if (err) {
                return done(err, false, 'Falha na comunicação com o servidor');
            } else if (!user) {
                return done(err, false, 'Usuário não encontrado')
            } else if (user.pass !== md5(password)) {
                return done(err, false, 'Senha Incorreta')
            } else if (user.blacklist) {
                return done(err, false, 'Usuário Banido')
            } else {
                if (user) delete user.pass
                return done(err, user)
            }
        });
    }));

    app.post(schema.routes.authLogin, (req, res, next) => {
        passport.authenticate('local-login', function (err, user, message) {
            if (err) return res.json({
                error: true,
                message: message
            })
            if (!user) return res.json({
                error: true,
                message: message
            })
            req.logIn(user, function (err) {
                return res.json(user)
            })
        })(req, res, next)
    })

    // EFETUA LOGOUT
    app.get(schema.routes.authLogout, (req, res) => {
        req.logout()
        res.sendStatus(200)
    });

    app.get(schema.routes.authToken, (req, res) => {
        if (req.isAuthenticated()) {
            mongodb.collection(schema.collections.users).findOne({
                _id: req.user._id
            }, (err, user) => {
                var now = new Date().getTime();
                if (req.user.token) {
                    if (req.user.token.enabled && now > (req.user.token.timeout || 0)) {
                        res.render(schema.templates.authToken, {
                            message: ""
                        });
                    } else {
                        res.redirect(settings.url + schema.routes.index);
                    }
                } else {
                    res.redirect(settings.url + schema.routes.index);
                }
            });
        } else {
            res.redirect(settings.url + schema.routes.authLogin);
        }
    });

    app.post(schema.routes.authToken, (req, res) => {
        if (req.isAuthenticated()) {
            mongodb.collection(schema.collections.users).findOne({
                _id: req.user._id
            }, (err, user) => {
                var verified = Speakeasy.totp.verify({
                    secret: user.token.secret,
                    encoding: "base32",
                    token: req.body.token
                });

                if (verified) {
                    var now = new Date().getTime();
                    var session = md5(new Date().getTime());

                    mongodb.collection(schema.collections.users).updateOne({
                        _id: user._id
                    }, {
                            $set: {
                                "token.timeout": now + (settings.session.timeout * 1000)
                            },
                            $push: {
                                "sessions": {
                                    id: session,
                                    timeout: now + settings.session.timeout
                                }
                            }
                        });

                    res.cookie('connect.token', session, {
                        maxAge: 86400
                    }).redirect(settings.url + schema.routes.index);
                } else {
                    res.render(schema.templates.authToken, {
                        message: i18n.__("Token inválido")
                    });
                }
            });
        } else {
            res.redirect(settings.url + schema.routes.authLogin);
        }
    });

    // CHECA SE O USUÁRIO ESTÁ AUTENTICADO EM TEMPO DE EXECUÇÃO
    app.get(schema.routes.checkUser, (req, res) => {
        if (req.user) {
            let user = req.user
            delete user['pass']
            res.json(user)
        } else {
            res.json({
                admin: false,
                login: false
            })
        }
    })
};
