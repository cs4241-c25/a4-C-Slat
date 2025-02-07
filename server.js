// IMPORTANT: you must run `npm install` in the directory for this assignment
// to install the mime library if you're testing this on your local machine.
// However, Glitch will install it automatically by looking in your package.json file.

const express = require("express")
const path = require("node:path");
const app = express(); //Express requirements
const mongoose = require("mongoose");
const session = require("express-session");
const uri = "mongodb+srv://ctslattery:l7CpTIWrBZuDKZdG@cs4241.3i466.mongodb.net/?retryWrites=true&w=majority&appName=cs4241";
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));


//app.use section
app.use(express.static(path.join(__dirname, 'public'))) //gives our static files in public directory
app.use(session({
    secret: 'spooky-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.json())

//Schemas:

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    director: { type: String, required: true },
    year: Number,
    duration: Number,
    rating: String,
    review: String,
})

const Movie = mongoose.model("Movie", movieSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } else {
        res.redirect('/login');
    }
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

//login app.post
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username, password });
            await user.save();
        } else if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.username = username;
        console.log("Session after login:", req.session);
        res.json({ success: true });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//app.get URLs for movie stuff
app.get('/movie/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id)
        if (movie) {
            res.send(`
            <html lang="en"><head><title> Movie Info: </title></head></html>
            <body><h1>Movie: ${movie.title}</h1>
            <p>Director: ${movie.director}</p>
            <p>Year: ${movie.year}</p>
            <p>Duration: ${movie.duration} minutes</p>
            <p>Rating: ${movie.rating || 'N/A'}</p>
            <p>Review: ${movie.review || 'N/A'}</p></body></html>
             `);
        } else {
            res.status(404).send('Movie not found!')
        }
    } catch (err) {
        res.status(500).send('Could not fetch movie info!')
    }
})

//specific user movies
app.get('/user-profile', async (req, res) => {
    if (req.session.username) {
        try {
            const user = await User.findOne({ username: req.session.username });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userMovies = await Movie.find({ user: req.session.username }).sort({ title: 1 });
            return res.json({
                username: user.username,
                movies: userMovies,
            });
        } catch (err) {
            console.error("Error fetching user profile:", err);
            return res.status(500).json({ error: 'Could not fetch user profile' });
        }
    } else {
        console.log("User is not logged in.");
        return res.status(401).json({ error: 'User not logged in' });
    }
});



app.get('/api/movies', async (req, res) => {
    try {
        if (!req.session.username) {
            return res.status(401).json({ error: "Please log in!" });
        }
        const movies = await Movie.find({ user: req.session.username }).sort({ title: 1 });
        res.json(movies);
    } catch (err) {
        res.status(500).send('Could not retrieve movies from the database!');
    }
});

//app.post movie stuff
app.post('/api/movies', async (req, res) => {
    const { title, director, year, duration, rating, review } = req.body;
    const username = req.session.username;
    if (!username) {
        return res.status(401).json({ error: 'Log in to add movies!' });
    }

    try {
        const newMovie = new Movie({title, director, year, duration, rating, review, user: username });
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (err) {
        console.error("Error saving movie:", err);
        res.status(500).send('Could not save movie info!');
    }
});

//app.delete method

app.delete('/api/movies/:id', async (req, res) => {
    const movieId = req.params.id;
    const username = req.body.user || req.session.username;

    try {
        const movie = await Movie.findOneAndDelete({ _id: movieId, user: username });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found!' });
        }
        res.json({ message: 'Movie deleted successfully!' });
    } catch (err) {
        res.status(500).send('Could not delete movie!');
    }
});


// process.env.PORT references the port that Glitch uses
// the following line will either use the Glitch port or one that we provided
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

//server.listen( process.env.PORT || port )


