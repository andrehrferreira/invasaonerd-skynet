/**
 * Debug personalizado
 * @author André Ferreira <andrehrf@gmail.com>
 */

let colors = require("colors");

module.exports = {
	log: function(owner, msg) {
		var time = new Date().toLocaleTimeString("pt-BR");
		console.log(colors.blue(time), colors.green("[" + owner + "]"), msg);
	},

	error: function(owner, msg) {
		var time = new Date().toLocaleTimeString("pt-BR");
		console.log(colors.blue(time), colors.green("[" + owner + "]"), colors.bgRed(msg));
	}
}
