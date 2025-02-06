// IMPORTANT: you must run `npm install` in the directory for this assignment
// to install the mime library if you're testing this on your local machine.
// However, Glitch will install it automatically by looking in your package.json file.

const express = require("express")
const path = require("node:path");
const app = express(); //Express requirements
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const uri = "mongodb+srv://ctslattery:l7CpTIWrBZuDKZdG@cs4241.3i466.mongodb.net/?retryWrites=true&w=majority&appName=cs4241";
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

//Schemas:

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
})

const User = mongoose.model("User", userSchema);

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    director: { type: String, required: true },
    year: Number,
    duration: Number,
    rating: String,
    review: String,
    userID: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
})

const Movie = mongoose.model("Movie", movieSchema);

//Passport Check
passport.use(new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
}, async function(username, password, done){
        try {
            const user = await User.findOne({username: username})

            if (!user) {
                return done(null, false, {message: "Incorrect Username!"});
            }
            if (user.password !== password) {
                return done(null, false, {message: "Incorrect Password!"});
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }))

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    })
})


//app.use section

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public'))) //gives our static files in public directory
app.use(express.json())

//app.get URLs login related

app.get("/", (req, res) => {
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/movie');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

//app.get URLs for movie stuff
//check on this part with id's
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


app.get('/movie', isAuthenticated, async (req, res) => {
    try{
        const movie = await Movie.find({ userID: req.user._id }).sort({ title: 1})
        res.json(movie)
    } catch(err){
        res.status(500).send('Could not fetch movie info!')
    }
})

app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find().sort({ title: 1 }); //sorts alphabetically by title
        res.json(movies);
    } catch (err) {
        res.status(500).send('Could not retrieve movies from the database!');
    }
})

//app.post login stuff
app.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
        try {
            const newUser = new User({ username, password });
            await newUser.save();

            req.login(newUser, (err) => {
                if (err) return next(err);
                return res.redirect('/movie');
            });
        } catch (err) {
            return res.status(500).send('Error creating account.');
        }
    } else {
        passport.authenticate('local', {
            successRedirect: '/movie',
            failureRedirect: '/login',
        })(req, res, next);
    }
});

//checks authentication and if not returns to login
function isAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    } else {
        res.redirect('/login')
    }
}

//app.post movie stuff
app.post('/api/movies', async (req, res) => {
    const { title, director, year, duration, rating, review, id } = req.body;
    try {
        // Create a movie associated with the logged-in user
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).send('Invalid ID');
            }
            const existingMovie = await Movie.findById(id)
            if (existingMovie) {
                existingMovie.year = year;
                existingMovie.duration = duration;
                existingMovie.rating = rating;
                existingMovie.review = review;
                await existingMovie.save();
                return res.json(existingMovie);
            } else {
                return res.status(404).send('Movie not found!');
            }
        } else {
            const existingMovie = await Movie.findOne({ title, director, userId: req.user._id }); // Make sure movie belongs to logged-in user
            if (existingMovie) {
                existingMovie.year = year;
                existingMovie.duration = duration;
                existingMovie.rating = rating;
                existingMovie.review = review;
                await existingMovie.save();
                return res.json(existingMovie);
            } else {
                const newMovie = new Movie({
                    title,
                    director,
                    year,
                    duration,
                    rating,
                    review,
                    userId: req.user._id, // Associate the movie with the logged-in user
                });
                await newMovie.save();
                return res.status(201).json(newMovie);
            }
        }
    } catch (err) {
        res.status(500).send('Could not save movie info!');
    }
});


// process.env.PORT references the port that Glitch uses
// the following line will either use the Glitch port or one that we provided
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

//server.listen( process.env.PORT || port )

