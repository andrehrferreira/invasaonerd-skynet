let wiki = require("wikijs").default;

wiki({ apiUrl: 'https://wikipedia.org/w/api.php' }).page('Harry Potter')
    .then(page => page.fullInfo())
    .then(data => console.log(data))