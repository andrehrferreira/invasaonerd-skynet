/**
 * Sistema de cache com redis
 * @author André Ferreira <andrehrf@gmail.com>
 */

const md5 = require("md5");

module.exports = (redis) => {
    return function(prefix, ref, data, expire, del) {
        let key = prefix + (ref ? formatRef(ref) : '');
        if (prefix === 'getRedis') {
            return new Promise(resolve => { resolve(redis) })
        } else if (data) {
            if (!data.removed) {
                redis.set(key, JSON.stringify(data))
                if (expire) redis.expire(key, getExpireTime(expire))
            } else {
                redis.del(key)
            }            
        } else if (del === 'delete') {
            redis.del(key)
        } else {
            return new Promise((resolve, reject) => {
                redis.get(key, (err, data) => {
                    try {
                        const parse = JSON.parse(data)
                        if(err || parse == null || parse.length === 0) reject(err || key + ' - not found')
                        else resolve(parse)
                    } catch (error) {
                        reject(error || key + ' - error ')
                    }
                })
            })
        }
    }
}

function getExpireTime(time) {
    const expire = {
        inAweek: 302400,
        inAday: 43200,
        inHour: 3600,
        inHalfHour: 1800,
        inFifteenMinutes: 900,
        inFiveMinutes: 300
    }
    if (expire[time]) return expire[time]
    if (typeof time === 'number') return time
    return -1
}

function formatRef (ref) {
    if (ref !== ':*') {
        return ':' + md5(ref)
    }
    return ref
}
