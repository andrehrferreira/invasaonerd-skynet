/**
 * Cluster server
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

 'use strict'

let cluster = require('cluster');

if (cluster.isMaster) {
    for (let i = 0; i < require('os').cpus().length; i++)
        cluster.fork();

    cluster.on('exit', function(deadWorker, code, signal) {
        cluster.fork();
    });
} else {
    require('./server.js');
}
