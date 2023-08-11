var Bing = require('node-bing-api')({ accKey: "1f5f40569b8e4d568c212b5ada6988d4" });

Bing.images("Homem de Ferro", {
  count: 15,
  market: 'pt-BR'
  }, function(error, res, body){
    console.log(body);
  });
