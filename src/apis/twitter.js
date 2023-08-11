/**
 * Twitter Infos
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const Crawler = require("crawler")
var crawler = new Crawler({})

module.exports = (url) => {
    return new Promise(resolve => {
        crawler.queue({
            uri: url,
            callback: function(err, res, done) {
                if(err) {
                    console.log(err)
                    resolve({ error: true })
                } else {
                    const { $ } = res
                    var cover = $('div.ProfileCanopy-headerBg > img')
                    if (cover.length) cover = cover[0].attribs.src
                    else cover = ''
                    var avatar = $('a.ProfileAvatar-container > img')
                    if (avatar.length) avatar = avatar[0].attribs.src
                    else avatar = ''
                    if (cover || avatar) {
                        resolve({
                            cover,
                            avatar
                        })
                    } else {
                        resolve({ error: true })
                    }
                }
                done()
            }
        })
    })
}
