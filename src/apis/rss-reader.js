/**
 * RSS Reader
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";
let Parser = require('rss-parser')
let parser = new Parser()

module.exports = (url) => {
    return new Promise((resolve) => {
        parser.parseURL(url).then(feeds => {
            feeds.items = feeds.items.filter((feed, index) => {
                return index < 30
            })
            resolve(feeds)
        }).catch(err => {
            resolve({ items: [] })
        })
    })
}