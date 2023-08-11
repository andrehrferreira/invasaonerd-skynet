/**
 * Criação de paginas
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

"use strict"

module.exports = async (_this, parses, app, mongodb, i18n, settings, schema, fs, cache) => {

    app.use(schema.routes.page, function(req, res, next) {
        const { originalUrl } = req
        if (originalUrl.includes('%20') && req.method === 'GET') {
            const string = originalUrl.split('%20').join('-')
            const newUrl = string.toLowerCase()
            return res.redirect(newUrl)
        } else if (originalUrl !== originalUrl.toLowerCase()) {
            return res.redirect(originalUrl.toLowerCase())
        }
        return next()
    })

    app.get(schema.routes.page, (req, res) => {
        var { user, params } = req
        if (user) delete user.pass
        else user = { admin: false, name: '' }
        const ref = decodeURI(params.ref).toLowerCase()
        cache("page", ref).then(async (page) => {
            if (!page.removed) {
                var order = { void: true }
                const cat = await mongodb.collection(schema.collections.categories).findOne({ text: page.categories[0] })
                if (cat) if (cat.order) order = cat.order
                res.render(schema.templates.page, {
                    page: parses.parsePage(page, settings),
                    user: user,
                   
                    order
                })
            } else {
                cache("page", ref, false, false, 'delete')
                res.redirect(schema.routes.nomatch + '/' + page.title)
            }
        }).catch(err => {
            return cache("search-pages", false).then(searchPages => {
                var find = []
                find = searchPages.filter(page => {
                    const findTitle = page.title.toLowerCase() === ref.split('-').join(' ')
                    const findNickname = page.nickname ? page.nickname.toLowerCase() === ref.split('-').join(' ') : false
                    const findEnglishTitle = page.englishTitle ? page.englishTitle.toLowerCase() === ref.split('-').join(' ') : false
                    const findUrl = page.url === ref
                    return (findTitle || findNickname || findEnglishTitle || findUrl) && (find.length === 0)
                })
                if (find.length) {
                    const page = find[0]
                    if ((ref.split('-').join(' ') === page.nickname.toLowerCase() ||
                        ref.split('-').join(' ') === page.englishTitle.toLowerCase())) {
                        res.redirect('/page/' + page.url)
                    } else {
                        findPageOnDb(ref, mongodb, cache, schema, res, parses, settings, user)
                    }
                } else {
                    findPageOnDb(ref, mongodb, cache, schema, res, parses, settings, user)
                }
            }).catch(() => {
                cache("search-pages", false, [])
                return res.redirect('/page/' + req.params.ref)
            })
        })
    })

    app.get(schema.routes.cover, (req, res) => {
        cache("page", decodeURI(req.params.ref)).then((page) => {
            if (page.cover) {
                var img = new Buffer.from(page.cover.replace("data:image/jpeg;base64,", ""), 'base64')
                res.writeHead(200, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': img.length
                })
                return res.end(img)
            }
            var img = fs.readFileSync('./public/assets/img/default_cover.jpg');
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            return res.end(img, 'binary');
        }).catch(() => {
            mongodb.collection(schema.collections.pages).findOne({
                $and: [{
					removed: {
						$not: {
							$eq: true
						}
					}
				}, {
                    url: decodeURI(req.params.ref)
                }]
            }, (err, page) => {
                if (err || !page) {
                    var img = fs.readFileSync('./public/assets/img/default_cover.jpg');
                    res.writeHead(200, {'Content-Type': 'image/jpg' });
                    return res.end(img, 'binary');
                }
                cache("page", page.url, page, 'inHour')
                if (page.cover) {
                    var img = new Buffer.from(page.cover.replace("data:image/jpeg;base64,", ""), 'base64')
                    res.writeHead(200, {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': img.length
                    })
                    return res.end(img)
                }
                var img = fs.readFileSync('./public/assets/img/default_cover.jpg');
                res.writeHead(200, {'Content-Type': 'image/jpg' });
                return res.end(img, 'binary');
            })
        })
    })

    app.get(schema.routes.avatar, (req, res) => {
        cache("page", decodeURI(req.params.ref)).then((page) => {
            if (page.avatar) {
                var img = new Buffer.from(page.avatar.replace("data:image/jpeg;base64,", ""), 'base64')
                res.writeHead(200, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': img.length
                })
                return res.end(img)
            }
            var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
            res.writeHead(200, {'Content-Type': 'image/jpeg' });
            return res.end(img, 'binary');
        }).catch(() => {
            mongodb.collection(schema.collections.pages).findOne({
                $and: [{
					removed: {
						$not: {
							$eq: true
						}
					}
				}, {
                    url: decodeURI(req.params.ref)
                }]
            }, (err, page) => {
                if (err || !page) {
                    var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
                    res.writeHead(200, {'Content-Type': 'image/jpeg' });
                    return res.end(img, 'binary');
                }
                cache("page", page.url, page, 'inHour')
                if (page.avatar) {
                    var img = new Buffer.from(page.avatar.replace("data:image/jpeg;base64,", ""), 'base64')
                    res.writeHead(200, {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': img.length
                    })
                    return res.end(img)
                }
                var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
                res.writeHead(200, {'Content-Type': 'image/jpeg' });
                return res.end(img, 'binary');
            })
        })
    })

    app.get(schema.routes.miniavatar, (req, res) => {
        cache("page", decodeURI(req.params.ref)).then((page) => {
            if (page.miniavatar) {
                var img = new Buffer.from(page.miniavatar.replace("data:image/jpeg;base64,", ""), 'base64')
                res.writeHead(200, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': img.length
                })
                return res.end(img)
            }
            var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
            res.writeHead(200, {'Content-Type': 'image/jpeg' });
            return res.end(img, 'binary');
        }).catch(() => {
            mongodb.collection(schema.collections.pages).findOne({
                $and: [{
					removed: {
						$not: {
							$eq: true
						}
					}
				}, {
                    url: decodeURI(req.params.ref)
                }]
            }, (err, page) => {
                if (err || !page) {
                    var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
                    res.writeHead(200, {'Content-Type': 'image/jpeg' });
                    return res.end(img, 'binary');
                }
                cache("page", page.url, page, 'inHour')
                if (page.miniavatar) {
                    var img = new Buffer.from(page.miniavatar.replace("data:image/jpeg;base64,", ""), 'base64')
                    res.writeHead(200, {
                        'Content-Type': 'image/jpeg',
                        'Content-Length': img.length
                    })
                    return res.end(img)
                }
                var img = fs.readFileSync('./public/assets/img/avatardefault.jpeg');
                res.writeHead(200, {'Content-Type': 'image/jpeg' });
                return res.end(img, 'binary');
            })
        })
    })

    app.get(schema.routes.search, async (req, res) => {
        const { ref } = req.params

        const query = {}

        if (ref.length < 5) {
            query.search = {
                '$regex' : req.params.ref,
                '$options' : 'i^'
            }
        } else {
            query.$text = {
                $search: ref,
                $caseSensitive: false,
                $diacriticSensitive: false
            }
        }

        try {
            const results = await mongodb.collection(schema.collections.search)
            .find(query)
            .project({ score: { $meta: "textScore" } })
            .sort({ score: { $meta:"textScore" } })
            .limit(10)
            .toArray()
            res.send(results)
        } catch (err) {
            console.log(err)
            return res.send([])
        }
    })

    app.post(schema.routes.page, (req, res) => {
        const { page } = req.body
        var dataSet = {
            editRef: page.ref + '-' + page.user._id,
            editDate: new Date().getTime(),
            status: 'pending',
            ...page
        }
        delete dataSet._id
        cache("page", page.url).then((cachedPage) => {
            if (dataSet.avatar.includes('/image/')) dataSet.avatar = cachedPage.avatar
            if (dataSet.cover.includes('/image/')) dataSet.cover = cachedPage.cover
            if (dataSet.miniavatar.includes('/image/')) dataSet.miniavatar = cachedPage.miniavatar
        }).catch(() => {})
        cache("search-pages", false).then(searchPages => {
            if (!searchPages.some(p => p.ref === page.ref)) {
                searchPages.push({
                    title: page.title,
                    nickname: page.nickname ? page.nickname : '',
                    englishTitle: page.englishTitle ? page.englishTitle : '',
                    ref: page.ref,
                    url: page.url
                })
            } else {
                searchPages = searchPages.map(p => {
                    if (p.ref === page.ref) return {
                        title: page.title,
                        nickname: page.nickname ? page.nickname : '',
                        englishTitle: page.englishTitle ? page.englishTitle : '',
                        ref: page.ref,
                        url: page.url
                    }
                    else return p
                })
            }
			cache("search-pages", false, searchPages)
        }).catch((err) => {
            cache("search-pages", false, [{
                title: page.title,
                nickname: page.nickname ? page.nickname : '',
                englishTitle: page.englishTitle ? page.englishTitle : '',
                ref: page.ref,
                url: page.url
            }])
        })
        mongodb.collection(schema.collections.revisions)
            .updateOne({
                editRef: dataSet.editRef,
                status: dataSet.status
            }, {
                $set: dataSet
            }, {
                upsert: true
            }).then(() => {
                mongodb.collection(schema.collections.revisions).findOne({
                    editRef: dataSet.editRef,
                    status: 'pending'
                }, (err, revision) => {
                    return res.json(revision)
                })
            })
    })

    app.post(schema.routes.follow, (req, res) => {
        const { user, id, add } = req.body
        delete user._id
        const val = add ? 1 : -1
        mongodb.collection(schema.collections.pages).updateOne({ id }, { $inc: { followers: val } })
        mongodb.collection(schema.collections.users)
            .updateOne({
                "user": user.user
            }, {
                $set: user
            }, {
                upsert: true
            })
            .then(() => {
                return res.sendStatus(200)
            })
            .catch((err) => {
                console.log(err)
                return res.sendStatus(500)
            })
    })

    app.post(schema.routes.pageinfo, async (req, res) => {
        const { pages } = req.body
        try {
            const userpages = await mongodb.collection(schema.collections.pages).find({
                $and: [{
                    id: { $in: pages }
                }, {
                    removed: { $not: { $eq: true } }
                }]
            })
            .project({ id: 1, title: 1, nickname: 1, url: 1 })
            .toArray()
            return res.send(userpages)
        } catch (err) {
            return res.send([])
        }
    })

    app.get('/check-title', (req, res) => {
        const { title } = req.query
        mongodb.collection(schema.collections.pages).findOne({
            $and: [{
                title: new RegExp(["^", title, "$"].join(""), "i")
            }, {
                removed: { $not: { $eq: true } }
            }]
        }, (err, page) => {
            if (page) res.send({ exist: true })
            else res.send({ exist: false })
        })
    })
    app.get('/check-nickname', (req, res) => {
        const { nickname } = req.query
        mongodb.collection(schema.collections.pages).findOne({
            $and: [{
                nickname: new RegExp(["^", nickname, "$"].join(""), "i")
            }, {
                removed: { $not: { $eq: true } }
            }]
        }, (err, page) => {
            if (page) res.send({ exist: true })
            else res.send({ exist: false })
        })
    })
    app.get('/check-englishTitle', (req, res) => {
        const { englishTitle } = req.query
        mongodb.collection(schema.collections.pages).findOne({
            $and: [{
                englishTitle: new RegExp(["^", englishTitle, "$"].join(""), "i")
            }, {
                removed: { $not: { $eq: true } }
            }]
        }, (err, page) => {
            if (page) res.send({ exist: true })
            else res.send({ exist: false })
        })
    })

    app.post('/get-featured-pages', (req, res) => {
        const { featuredPages } = req.body
        Promise.all(featuredPages.map(fp => {
            return new Promise(async resolve => {
                cache("page", fp).then(page => {
                    resolve({
                        title: page.title,
                        url: page.url
                    })
                })
                .catch(() => {
                    mongodb.collection(schema.collections.pages).findOne({
                        url: fp
                    }, (err, page) => {
                        cache("page", page.url, page, 'inHour')
                        if (err || !page) resolve({ error: true })
                        else resolve({
                            title: page.title,
                            url: page.url
                        })
                    })
                })
            })
        })).then(pages => {
            res.send(pages)
        })
    })
}

function findPageOnDb(ref, mongodb, cache, schema, res, parses, settings, user, mode) {
    mongodb.collection(schema.collections.pages).findOne({
        $and: [{
            $or: [{
                title: new RegExp(["^", ref, "$"].join(""), "i")
            }, {
                nickname: new RegExp(["^", ref, "$"].join(""), "i")
            }, {
                englishTitle: new RegExp(["^", ref, "$"].join(""), "i")
            }, {
                url: ref
            }]
        }, {
            removed: { $not: { $eq: true } }
        }]
    }, async (err, page) => {
        if(page){
            await cache("page", page.url, page, 'inHour')
            const searchPages = await cache("search-pages", false)
            await searchPages.push({
                title: page.title,
                nickname: page.nickname ? page.nickname : '',
                englishTitle: page.englishTitle ? page.englishTitle : '',
                url: page.url,
                ref: page.ref
            })
            await cache("search-pages", false, searchPages)
            await res.redirect(`/page/${page.url}`)
        } else {
            res.redirect(schema.routes.nomatch + '/' + ref)
        }
    })
}