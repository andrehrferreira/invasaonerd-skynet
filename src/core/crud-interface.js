/**
 * Interface para CRUD
 * @author André Ferreira <andrehrf@gmail.com>
 */

"use strict";

let ObjectID = require('mongodb').ObjectID;

module.exports = function(route, template, colletion, privilege) {
	return {
		cbonInsert: null,
		cbonEdit: null,
		cbonDelete: null,

		onInsert: function(cb) {
			if (typeof cb == "function")
				this.cbonInsert = cb
		},

		onEdit: function(cb) {
			if (typeof cb == "function")
				this.cbonEdit = cb
		},

		onDelete: function(cb) {
			if (typeof cb == "function")
				this.cbonDelete = cb
		},

		create: function(_this, app, mongodb) {
			var __this = this;

			app.get(route, _this.isAuthenticated, (req, res) => { //TEMPLATE
				try {
					if (req.user.root || req.user.privileges[privilege])
						res.render(template, {
							user: req.user
						});
					else
						res.status(401).send("Unauthorized");
				} catch (e) {
					res.status(401).send("Unauthorized");
				}
			});

			app.get(route + "/form/:id", _this.isAuthenticated, (req, res) => { //EDIT
				try {
					if (req.user.root || req.user.privileges[privilege])
						res.render(template + "-form", {
							id: req.params.id,
							user: req.user
						});
					else
						res.status(401).send("Unauthorized");
				} catch (e) {
					res.status(401).send("Unauthorized");
				}
			});

			app.get(route + "/form", _this.isAuthenticated, (req, res) => { //INSERT
				try {
					if (req.user.root || req.user.privileges[privilege])
						res.render(template + "-form", {
							id: null,
							user: req.user
						});
					else
						res.status(401).send("Unauthorized");
				} catch (e) {
					res.status(401).send("Unauthorized");
				}
			});

			app.post(route, _this.isAuthenticated, (req, res) => { //SAVE (INSERT AND UPDATE)
				try {
					if (req.user.root || req.user.privileges[privilege]) {
						if (typeof req.body._id == "string") {
							var data = (typeof __this.cbonEdit == "function") ? __this.cbonEdit(req, res) : req.body;

							var dataParsed = {};

							for (var key in data)
								if (key != "_id")
									dataParsed[key] = data[key];

							mongodb.collection(colletion).updateOne({
								$or: [{
									_id: ObjectID(req.body._id)
								}, {
									_id: req.body._id
								}]
							}, {
								$set: dataParsed
							});

							if (req.xhr)
								res.json({
									status: "ok"
								})
							else
								res.render(template, {
									user: req.user
								});
						} else {
							var data = (typeof __this.cbonInsert == "function") ? __this.cbonInsert(req, res) : req.body;
							mongodb.collection(colletion).insert(data);

							if (req.xhr)
								res.json({
									status: "ok"
								})
							else
								res.render(template, {
									user: req.user
								});
						}
					} else {
						if (req.xhr)
							res.json({
								error: "Unauthorized"
							});
						else
							res.status(401).send("Unauthorized");
					}
				} catch (e) {
					if (req.xhr)
						res.json({
							error: e.message
						});
					else
						res.status(500).send(e.message);
				}
			});

			app.delete(route + "/:id", _this.isAuthenticated, (req, res) => { //DELETE
				try {
					if (req.user.root || req.user.privileges[privilege]) {
						mongodb.collection(colletion).deleteOne({
							$or: [{
								_id: ObjectID(req.params.id)
							}, {
								_id: req.params.id
							}]
						}, (err, result) => {
							if (typeof __this.cbonDelete == "function")
								__this.cbonDelete(req.params.id);

							if (req.xhr) {
								res.json({
									error: err,
									result: result
								});
							} else {
								if (err) res.status(500).send(err);
								else res.status(200).send(result);
							}
						});
					}
				} catch (e) {
					if (req.xhr)
						res.json({
							error: e.message
						});
					else
						res.status(500).send(e.message);
				}
			});
		}
	}
}
