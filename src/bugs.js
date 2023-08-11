/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";
const ObjectID = require('mongodb').ObjectID

module.exports = (_this, app, mongodb, settings, schema, gmailSend, notify, socket) => {
	app.post(schema.routes.bugs, async (req, res) => {
		const { bug } = req.body
		bug.timestamp = new Date().getTime()
		try {
			await mongodb.collection(schema.collections.bugs).insertOne(bug)
			const attachments = bug.screenshots.map((img, index) => {
				return {
					filename: `images${index + 1}.jpeg`,
					content: img.replace('data:application/octet-stream;base64', ''),
					encoding: 'base64'
				}
			})
			delete bug.screenshots
			const tos = schema.email.adminEmails
			tos.push('diego@invasaonerd.com.br')
			gmailSend.sendMail({
				to:		tos,
				from:	schema.email.user,
				subject: schema.email.subjects.bug,
				html:	`
					<h1>Um BUG foi reportado</h1>
					<p>Titulo: ${bug.title}</p>
					<p>Usuário: ${bug.user}</p>
					<p>Data: ${new Date(bug.timestamp).toLocaleString()}</p>
					<p>Detalhes: ${bug.details}</p>
				`,
				attachments
			})
			res.send({ error: false })
		} catch (err) {
			res.send({ error: true, moreinfo: err })
		}
	})

	app.get(schema.routes.bugs, async (req, res) => {
		var { user } = req.query
		try {
			var bugs = []
			const bugsCollection = mongodb.collection(schema.collections.bugs)
			if (user) {
				bugs = await bugsCollection.find({ user: user, solved: false }).toArray()
			} else {
				bugs = await bugsCollection.find().toArray()
			}
			res.send(bugs)
		} catch (err) {
			res.send({ error: true, moreinfo: err })
		}
	})
}
