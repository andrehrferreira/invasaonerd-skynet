/**
 * Índices dinâmicos do MongoDB
 * @author André Ferreira <andrehrf@gmail.com>
 */

"use strict";

module.exports = (mongodb, schema) => {
    //Usuarios
    mongodb.collection(schema.collections.users).createIndex({user: 1})
    mongodb.collection(schema.collections.users).createIndex({email: 1})
    mongodb.collection(schema.collections.users).createIndex({pass: 1})
    mongodb.collection(schema.collections.users).createIndex({root: 1})

    // Search
    mongodb.collection(schema.collections.search).createIndex({ "$**": "text" })

    // Pages
    mongodb.collection(schema.collections.pages).createIndex({ ref: 1 })
    mongodb.collection(schema.collections.pages).createIndex({ url: 1 })
    mongodb.collection(schema.collections.pages).createIndex({ id: 1 })
    mongodb.collection(schema.collections.pages).createIndex({ title: 1 })

    // Feeds
    mongodb.collection(schema.collections.feeds).createIndex({ idpage: 1 })
}
