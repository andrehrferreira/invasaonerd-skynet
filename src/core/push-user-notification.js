/**
 * Índices dinâmicos do MongoDB
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const ObjectID = require('mongodb').ObjectID


module.exports = (oneSignalPush, mongodb, schema, socket) => {
	return {
		async usersPages (notification) {
			try {
				mongodb.collection(schema.collections.users).updateMany({
					$and: [{
						pages: { $eq: notification.pageId }
					}, {
						blacklist: false
					}]
				}, {
					$push: { notifications: notification }
				})
				socket.emit(`page-${notification.pageId}`, notification)
				oneSignalPush({
					pageId: notification.pageId,
					notification: {
						title: "Invasão Nerd",
						subtitle: notification.message,
						url: notification.href
					}
				})
				return { error: false }
			} catch (err) {
				console.log(err)
				return { error: true }
			}
		},
		async user (userId, notification) {
			try {
				await mongodb.collection(schema.collections.users).updateOne({
					"_id": ObjectID(userId)
				}, {
					$push: { notifications: notification }
				}, {
					upsert: true
				})
				socket.emit(`user-${userId}`, notification)
				oneSignalPush({
					userId,
					notification: {
						title: "Invasão Nerd",
						subtitle: notification.message,
						url: notification.href
					}
				})
				return { error: false }
			} catch (err) {
				console.log(err)
				return { error: true }
			}
		}
	}
}
