/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

module.exports = (_this, parses, app, mongodb, i18n, settings, schema, wallpapers, cache, notify, socket) => {

    app.use(schema.routes.feedback, function(req, res, next) {
        if (req.user) {
            if (req.user.admin) {
                next()
            } else {
                res.redirect('/')
            }
        } else {
            res.redirect('/')
        }
    })

    app.use(schema.routes.feedbackRef, function(req, res, next) {
        if (req.user) {
            if (req.user.admin) {
                next()
            } else {
                res.redirect('/')
            }
        } else {
            res.redirect('/')
        }
    })

    // GET /feedback
    app.get(schema.routes.feedback, (req, res) => {
        var { user } = req
        if (user) delete user.pass
        mongodb.collection(schema.collections.revisions).find({
            status: 'pending'
        }).toArray((err, pages) => {
            res.render(schema.templates.feedback, {
                pages: pages.map(page => parses.parsePage(page, settings)),
                user: user
            })
        })
    })

    // GET /feedback/:ref
    app.get(schema.routes.feedbackRef, (req, res) => {
        var { user } = req
        if (user) delete user.pass
        mongodb.collection(schema.collections.revisions).findOne({
            editRef: req.params.ref,
            status: 'pending'
        }, async (err, revision) => {
            var order = { void: true }
            const cat = await mongodb.collection(schema.collections.categories).findOne({ text: revision.categories[0] })
            if (cat) if (cat.order) order = cat.order
            if (revision) {
                res.render(schema.templates.page, {
                    page: revision,
                    ref: revision.ref,
                    order,
                    user: user
                })
            } else {
                res.redirect(schema.routes.index)
            }
        })
    })

    // POST /feedback { revision }
    app.post(schema.routes.feedback, (req, res) => {
        const revision = req.body
        delete revision._id
        revision.feedbackDate = new Date().getTime()
        mongodb.collection(schema.collections.revisions).updateOne({
            ref: revision.ref,
            status: 'pending'
        }, {
            $set: revision
        }, {
            upsert: true
        })
        .then(() => {
            res.sendStatus(200)
        })
    })

    // PUT /feedback { revision }
    app.put(schema.routes.feedback, async (req, res) => {
        let { page } = req.body
        const date = new Date().getTime()

        // SETANDO COMO APROVADO
        await mongodb.collection(schema.collections.revisions)
                .updateOne({editDate: page.editDate, status: 'pending' },
                    { $set: { status: 'aproved', feedbackDate: date } },
                    { upsert: true })
        // SETANDO PONTUAÇÃO PRO USER
        const points = await page.changes.filter((change, index, arr) => {
            return arr.indexOf(change) == index
        })
        delete page.changes
        await mongodb.collection(schema.collections.users)
                .updateOne({ email: page.user.email },
                    { $inc: { points: points.length } },
                    { upsert: true })
        await notify.user(page.user._id, {
            new: true,
            clicked: false,
            href: `${settings.url}/page/${page.url}`,
            image: settings.url + '/assets/img/success.png',
            message: `A edição da página ${page.title} foi aprovada e você ganhou ${points.length} ${points.length === 1 ? 'ponto' : 'pontos'}!`,
            category: 'page',
            timestamp: new Date().getTime()
        }, mongodb, schema, socket)
        // SETANDO LOG DE ALTERAÇÃO
        await mongodb.collection(schema.collections.logs)
                .updateOne({ name: page.ref },
                    { $set: { title: page.title },
                        $push: {
                            logs: {
                                timestamp: date,
                                revisionRef: page._id,
                                userEditor: page.user,
                                userAprovator: page.aprovator,
                                action: 'Edição aprovada'
                            }
                        }
                    }, { upsert: true })
        // GRAVANDO ESTATISTICAS
        if (!page.editors) page.editors = await []
        await page.editors.push({
            _id: page.user._id,
            editAt: date
        })
        // MANIPULANDO IMAGENS E CHAVES
        page = await deleteKeys(page)
        if (page.cover) if (page.cover.includes('/cover.jpg')) await delete page.cover
        if (page.avatar) if (page.avatar.includes('/avatar.jpg')) await delete page.avatar
        if (page.miniavatar) if (page.miniavatar.includes('/miniavatar.jpg')) await delete page.miniavatar
        page.feedbackDate = await date
        if (!page.id) page.id = await date
        await mongodb.collection(schema.collections.pages).updateOne(
            { ref: page.ref },
            { $set: page },
            { upsert: true })
        if (!page.removed) await saveSearchIndex(page, mongodb, schema)
        else await deleteSeachIndex(page, mongodb, schema, cache)
        await cache("page", page.url).then((cachedPage) => {
            cache("page", page.url, parseImages(page, cachedPage), 'inHour')
            res.sendStatus(200)
        }).catch(() => {
            cache("page", page.url, page, 'inHour')
            res.sendStatus(200)
        })
    })
}

function saveSearchIndex (page, mongodb, schema) {
    let search = page.title
    search += ', ' + page.categories.join(', ')
    if (page.nickname) search += ', ' + page.nickname
    if (page.englishTitle) search += ', ' + page.englishTitle
    if (page.youtube) if (page.youtube.url) search += ', ' + page.youtube.keywords
    mongodb.collection(schema.collections.search)
        .updateOne({
                "url": page.url
            },{
                $set: {
                    title: formatTitle(page.title, page.nickname),
                    search: search,
                    url: page.url
                }
            }, {
                upsert: true
            })
}

function formatTitle (title, subtitle) {
    return title + (subtitle ? ` (${subtitle})` : '')
}

async function deleteSeachIndex (page, mongodb, schema, cache) {
    mongodb.collection(schema.collections.search).deleteOne({ "ref": page.ref })
    await cache("page", page.url, false, false, 'delete')
    var searchPages = await cache("search-pages", false)
    searchPages = await searchPages.filter(p => {
        return p.ref !== page.ref
    })
    await cache("search-pages", false, searchPages)
}

function parseImages(page, cachedPage) {
    if (!page.cover && cachedPage.cover) page.cover = cachedPage.cover
    if (!page.avatar && cachedPage.avatar) page.avatar = cachedPage.avatar
    if (!page.miniavatar && cachedPage.miniavatar) page.miniavatar = cachedPage.miniavatar
    return page
}

function deleteKeys(page) {
    for (let key in page) {
        if (key === '_id' || key === 'aprovator' ||
            key === 'editDate' || key === 'editRef' ||
            key === 'status' || key === 'user' ||
            key === 'originalRef') {
            delete page[key]
        }
    }
    return page
}
