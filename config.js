/**
 * Settings
 * @author André Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

let mode = process.env.NODE_ENV || "dev";

module.exports = {
	dev: {
		production: false,
		mongodb: {
			url: "mongodb://127.0.0.1:27017/skynet",
			database: "skynet"
		},
		redis: {
			host: "127.0.0.1",
			port: 6379
		},
		elasticsearch: {
			host: 'localhost:9200'
		},
		session: {
			secret: "skynet",
			timeout: 24 * 60 * 60
		},
		timezone: "America/Sao_Paulo",
		url: "http://localhost:8555"
	},
	stg: {
		port: 5050,
		production: false,
		mongodb: {
			url: "mongodb://10.136.162.95:27017/skynetStaging",
			database: "skynetStaging"
		},
		redis: {
			port: 6301,
			host: '10.136.109.59',
			family: 4,
			// password: '297fb6f428ad820b74812fe5f60a7effefed7ad11ec3340bd191d3864a0e8ccc',
			db: 0
		},
		elasticsearch: {
			host: 'elasticsearch:9200'
		},
		session: {
			secret: "skynet",
			timeout: 24 * 60 * 60
		},
		timezone: "America/Sao_Paulo",
		url: "https://stg.invasaonerd.com.br"
	},
	prod: {
		port: 5050,
		production: true,
		mongodb: {
			url: "mongodb://10.136.162.95:27017/skynet",
			database: "skynet"
		},
		redis: {
			port: 6300,
			host: '10.136.109.59',
			family: 4,
			// password: '297fb6f428ad820b74812fe5f60a7effefed7ad11ec3340bd191d3864a0e8ccc',
			db: 0
		},
		elasticsearch: {
			host: 'elasticsearch:9200'
		},
		session: {
			secret: "skynet",
			timeout: 24 * 60 * 60
		},
		timezone: "America/Sao_Paulo",
		url: "https://invasaonerd.com.br"
	}
} [mode];
