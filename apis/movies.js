let request = require("request-promise")

request("http://www.myapifilms.com/imdb/idIMDB?title=Homem+de+Ferro&token=73e9752b-a9e1-4bd4-93f9-ce838ba1e724&format=json&language=pt-br&aka=0&business=0&seasons=0&seasonYear=0&technical=0&filter=2&exactFilter=0&limit=10&forceYear=0&trailers=0&movieTrivia=0&awards=0&moviePhotos=0&movieVideos=0&actors=0&biography=0&uniqueName=0&filmography=0&bornAndDead=0&starSign=0&actorActress=0&actorTrivia=0&similarMovies=0&adultSearch=0&goofs=0&keyword=0&quotes=0&fullSize=0&companyCredits=0&filmingLocations=0").then((body) => {
    console.log(JSON.parse(body).data.movies)
}).catch((err) => {
    console.log(err);
})
