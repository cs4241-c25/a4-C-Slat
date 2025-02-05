    // IMPORTANT: you must run `npm install` in the directory for this assignment
    // to install the mime library if you're testing this on your local machine.
    // However, Glitch will install it automatically by looking in your package.json
    // file.

const express = require("express")
const path = require("node:path");
const req = require("express/lib/request"); //Express requirements
const app = express();

const movies = []
let nextId = 1

app.use(express.static(path.join(__dirname, 'public'))) //gives our static files in public directory

app.use('/', (req, res, next) => {
    console.log('Request URL: ' + req.url) //prints our URL
    next() //go to the next middleware for this route
})

app.get('/serverpage', (req, res) => {
    res.send('<html><head><title> Sample Page </title></head></html>' +
        '<link rel="stylesheet" href="public/css/main.css" /></head>' +
        '<body><h1>Sample Text!</h1></body>')
});

app.get('/movie/:id', (req, res) => {
   const movie = movies.find(m => m.id === parseInt(req.params.id)) //res.send('<html><title>Sample Page </title></html>' + //'<body><h1>Movie List: + req.params.id </h1></body>' ) //params should be pink here, look into why .get isnt creating param type!!!
   if (movie) {
       res.send(`
            <html><head><title> Movie Info: </title></head></html>
            <body><h1>Movie: ${movie.title}</h1>
            <p>Director: ${movie.director}</p>
            <p>Year: ${movie.year}</p>
            <p>Duration: ${movie.duration} minutes</p>
            <p>Rating: ${movie.rating || 'N/A'}</p>
            <p>Review: ${movie.review || 'N/A'}</p></body>
        `);
   } else {
       res.status(404).send('Movie not found!')
   }

})

app.get('/api', (req, res) => {
    res.json({firstname: 'John', lastname: 'Doe'}); //this can be replaced with my movie attributes
})

app.get('/api/movies', (req, res) => {
    res.json(movies)
})

app.post('/api/movies', express.json(), (req, res) => {
    let movie = req.body;

    movie.id = nextId++ //assigns ID to movie
    movie.sortableTitle = movie.title.toLowerCase()
        .replace(/^(a |an |the )/i, '') //slices leading articles
        .trim()

    const existingMovieIndex = movies.findIndex(m => //checks to see if movie already exists (movie.whatever isnt how i called it
        m.title.toLowerCase() === movie.title.toLowerCase() &&
        m.director.toLowerCase() === movie.director.toLowerCase()
    )
    if (existingMovieIndex !== -1) {
        movies[existingMovieIndex] = movie; //updates the movie
    } else {
        movies.push(movie) //adds new movie
    }
    movies.sort((a, b) => a.sortableTitle.localeCompare(b.sortableTitle)) //sorts the movies in alphabetical order by title
    res.status(200).json(movies)
})
    app.use((req, res) => {
        res.status(404).send('404 Error: Not Found!')
})

/*
const handleGet = function( request, response ) {
    const filename = dir + request.url.slice( 1 )

    if( request.url === "/" ) {
        sendFile( response, "public/index.html" )
    }else if(request.url === '/api/movies') {
           movies.sort((a, b) => a.sortableTitle.localeCompare(b.sortableTitle))
           response.writeHead(200, {"Content-Type": "application/json"})
           response.end(JSON.stringify(movies))
       } else {
           sendFile(response, filename)
       }
   }


   const handlePost = function(request, response) {
    let dataString = ""

    request.on("data", function(data) {
        dataString += data
    })

    request.on('end', function() {
        let movie = JSON.parse(dataString)

        movie.sortableTitle = movie.title.toLowerCase() //adds a sorting field
            .replace(/^(a |an |the )/i, '') //removes the leading articles
            .trim()

        const existingMovieIndex = movies.findIndex(m => //checks if the movie is in the table already by title and director
            m.title.toLowerCase() === movie.title.toLowerCase() &&
            m.director.toLowerCase() === movie.director.toLowerCase()
        )

        if (existingMovieIndex !== -1) { //if the movie is in the table already, updates the movie
            movies[existingMovieIndex] = movie
        } else {
            movies.push(movie)
        }

        movies.sort((a, b) => a.sortableTitle.localeCompare(b.sortableTitle)) //sorts the movies in alphabetical order by title

        response.writeHead(200, "OK", {'Content-Type': 'application/json'})
        response.end(JSON.stringify(movies))
    })
}

const sendFile = function( response, filename ) {
    const type = mime.getType( filename )

    fs.readFile( filename, function( err, content ) {

        // if the error = null, then we've loaded the file successfully
        if( err === null ) {

            // status code: https://httpstatuses.com
            response.writeHeader( 200, { "Content-Type": type })
            response.end( content )

        } else {

            // file not found, error code 404
            response.writeHeader( 404 )
            response.end( "404 Error: File Not Found" )

        }
    })
}
*/
// process.env.PORT references the port that Glitch uses
// the following line will either use the Glitch port or one that we provided
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

//server.listen( process.env.PORT || port )

