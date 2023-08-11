/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const ObjectID = require('mongodb').ObjectID,
    md5 = require("md5");

module.exports = (_this, fs, app, mongodb, i18n, passport, schema, cache) => {

    app.post(schema.routes.createUser, async (req, res) => {
        const { user, invite } = req.body
        try {
            const users = mongodb.collection(schema.collections.users)
            await mongodb.collection(schema.collections.invites).updateOne({ _id: invite._id }, { $set: invite }, { upsert: true })
            const adminUser = await mongodb.collection(schema.collections.users).findOne({ user: invite.user })
            adminUser.invites = adminUser.invites.map(ivt => {
                if (ivt.token === invite.token) return invite
                else return ivt
            })
            await mongodb.collection(schema.collections.users).updateOne({ user: invite.user }, {  $set: adminUser }, { upsert: true })
            const userRegister = await users.findOne({
                $or: [{
                    user: user.user
                },
                {
                    email: user.email
                }]
            })
            if (userRegister) {
                if (userRegister.user === user.user) return res.json({
                    error: 'Nome de usuário já cadastrado'
                })
                if (userRegister.email === user.email) return res.json({
                    error: 'Email já cadastrado'
                })
            } else {
                await users.insertOne({
                    ...user,
                    pass: md5(user.pass),
                    admin: false,
                    points: 0,
                    pages: [],
                    superadmin: false,
                    notifications: [],
                    strikes: [],
                    blacklist: false,
                    devices: []
                })
                res.json({  success: 'Cadastrado com sucesso' })
            }
        } catch (err) {
            console.log(err)
            res.sendStatus(500)
        }
        
    })

    app.get(schema.routes.editions, (req, res) => {
        var { user } = req
        if (user) delete user.pass
        if (req.user) {
            mongodb.collection(schema.collections.revisions).find({
                "user.user": req.user.user
            }).toArray((err, editions) => {
                res.render(schema.templates.feedback, {
                    pages: editions.map(page => {
                        return {
                            onlyView: true,
                            ref: page.ref,
                            user: page.user,
                            editRef: page.editRef,
                            status: page.status,
                            editDate: page.editDate,
                            anotation: page.anotation,
                            feedbackDate: page.feedbackDate
                        }
                    }),
                    user: user
                })
            })
        } else {
            res.render(schema.templates.indexWithoutLogin, { mode: req.mode })
        }
    })

    app.use('/checkuser/:ref', (req, res, next) => {
        if (req.user) next()
        else res.sendStatus(401)
    }, (req, res) => {
        const { ref } = req.params
        return mongodb.collection(schema.collections.users).findOne({
            $or: [{ email: ref }, { user: ref }]
        }).then(user => {
            if (!user) {
                res.send({ error: true, message: 'Usuário não encontrado' })
            } else {
                res.send({ user: user.user, name: user.name })
            }
            return
        })
    })

    app.post('/update-user-notifications', async (req, res) => {
        var { notifications, _id } = await req.body.user
        const aMounth = await new Date().getTime() - 2601132156
        notifications = await notifications.filter((n, i) => n.timestamp > aMounth && i < 50)
        await mongodb.collection(schema.collections.users)
			.updateOne({
				"_id": ObjectID(_id)
			}, {
				$set: { notifications: notifications }
			}, {
				upsert: true
			})
			.then(async () => {
				await res.send({ error: false })
			})
			.catch((err) => {
				console.log(err)
				res.send({ error: true })
			})
    })

    app.get(schema.routes.useravatar, (req, res) => {
        mongodb.collection(schema.collections.users).findOne({
            $and: [{
                blacklist: { $ne: true }
            }, {
                _id: ObjectID(req.params.ref)
            }]
        }, (err, user) => {
            if (err || !user) {
                var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
                res.writeHead(200, {'Content-Type': 'image/jpeg' });
                return res.end(img, 'binary')
            }
            delete user.pass
            return res.redirect(user.avatar)
        })
    })
}