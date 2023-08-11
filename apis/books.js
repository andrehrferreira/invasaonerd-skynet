var books = require('google-books-search-2');

books.search("Harry Potter", {
    type: 'books',
    lang: 'pt-br'
})
.then(function(results) {
	console.log(results);
})
.catch(function(error) {
	console.log(error);
});
