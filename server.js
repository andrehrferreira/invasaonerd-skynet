/**
 * Servidor de aplicação
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const { load } = require("organized")

load({
    express: "express",
    passport: "passport",
    newrelic: "newrelic",
    i18n: "i18n",
    debug: "./src/core/debug.js",
    CRUDInterface: "./src/core/crud-interface.js",
    schema: "./src/schema.json",
    wallpapers: "./src/wallpapers.json",
    fs: "fs",
    settings: "./config.js",
    ExpressSession: "express-session",
    parses: "./parses",
    SEO: "./SEO",
    oneSignalPush: (redis) => {
        return (message) => {
            redis.publish("sendPush", JSON.stringify(message));
        }
    },
    notify: (oneSignalPush, mongodb, schema, socket) => {
        return require("./src/core/push-user-notification.js")(oneSignalPush, mongodb, schema, socket)
    },
    gmailSend: (schema) => {
        const nodemailer = require('nodemailer')
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: schema.email.user,
                pass: schema.email.pass
            }
        })
    },
    pushToFeed: (schema, mongodb, settings) => {
        return async ({ url, title, id }, type, timestamp, payload, ) => {
            const { upsertedId } = await mongodb.collection(schema.collections.feeds).updateOne({
                publishedAt: timestamp
            }, {
                $set: {
                    feeder: { title, url },
                    idpage: id,
                    photo: `${settings.url}/image/${url}/miniavatar.jpg`,
                    publishedAt: timestamp,
                    type: type,
                    payload
                }
            }, {
                upsert: true
            })
            return upsertedId ? upsertedId._id.toHexString() : false
        }
    },
    dirname: () => {
        return __dirname;
    },
    app: (express) => {
        return express();
    },
    server: (app) => {
        return require('http').createServer(app)
    },
    cache: (redis) => {
        return require("./src/core/cache.js")(redis);
    },
    MongoStore: (ExpressSession) => {
        return require('connect-mongo')(ExpressSession);
    },
    socket: (server, settings) => {
        const redis = require('socket.io-redis')
        const io = require('socket.io').listen(server)
        io.adapter(redis({ host: settings.redis.host, port: settings.redis.port }))
        return io
    }
}, {
    provider: (_this, app, passport, MongoStore, ExpressSession, settings, newrelic, i18n, schema) => {
        //i18n
        i18n.configure({
            defaultLocale: "pt-BR",
            locales: ['pt-BR'],
            directory: __dirname + '/locales'
        })

        app.use(i18n.init);

        //Misc
        app.locals.newrelic = newrelic;

        //View Engine
        app.set('views', [__dirname + schema.templateFrontend]);
        app.set('view engine', 'ejs');
        app.locals.schema = schema;
        app.locals.settings = settings;
        app.locals.mode = process.env.NODE_ENV || "dev"

        //Statics
        app.use(require('serve-static')(__dirname + '/dist'));
        app.use(require('serve-static')(__dirname + '/public'));
        app.use(require('cookie-parser')());
        app.use(require('body-parser').urlencoded({
            extended: true,
            limit: '500mb'
        }));
        app.use(require('body-parser').json({
            limit: '500mb'
        }));

        //Passport
        app.use(ExpressSession({
            saveUninitialized: true,
            resave: true,
            secret: settings.session.secret,
            store: new MongoStore({
                url: settings.mongodb.url,
                db: settings.mongodb.database,
                ttl: settings.session.timeout,
                autoRemove: "native"
            })
        }));

        app.use(passport.initialize());
        app.use(passport.session());

        return true;
    },
    services: [(_this, settings, app, debug) => { //MongoDB
        let mongodb = require("mongodb").MongoClient
        mongodb.connect(settings.mongodb.url, { useNewUrlParser: true }, (err, client) => {
            if (err) debug.error("MongoDB", "Error to start: " + err)
            else debug.log("MongoDB", "Connection on " + settings.mongodb.url)
            const db = client.db(settings.mongodb.database)
            _this.set("mongodb", db)
        })

        return true;
    }, (_this, settings, app, debug) => { // Redis
        let Redis = require("redis");
        let clientRedis = Redis.createClient(settings.redis);
        clientRedis.on("connect", () => {
            debug.log("Redis", "Connection on " + settings.redis.host + ":" + settings.redis.port);
            _this.set("redis", clientRedis);
        });

        clientRedis.on("error", (err) => {
            debug.error("Redis", "Error to start: " + err);
        });

        return true;
    }, (_this, settings, app, debug) => { // Elastic Search
        /*let ElasticSearch = require("elasticsearch");
        let clientElasticSearch = new ElasticSearch.Client(settings.elasticsearch);

        clientElasticSearch.ping({ requestTimeout: 1000 }, (err) => {
          if (err) { debug.error("Elastic Search","Error to start: " + err);}
          else {
            debug.log("Elastic Search","Connection on " + settings.elasticsearch.host);
            _this.set("elasticsearch", clientElasticSearch);
          }
        });*/

        return true;
    }, (_this, settings, app, debug) => { // Neo4j
        return true;
    }],
    map: [`${__dirname}/src/controllers/core/mongo-index.js`, `${__dirname}/src/*.js`], //Mapping controllers diretory
    scope: (_this, server, settings, debug) => {
        const PORT = process.env.PORT || settings.port || 8555
        server.listen(PORT, "0.0.0.0", () => { debug.log("Express", "Listen: 0.0.0.0:" + PORT); })
    }
}, {
    require: require
});
