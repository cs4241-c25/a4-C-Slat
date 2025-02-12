// IMPORTANT: you must run `npm install` in the directory for this assignment
// to install the mime library if you're testing this on your local machine.
// However, Glitch will install it automatically by looking in your package.json file.

const express = require("express")
const path = require("node:path");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require('passport-github2').Strategy
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
app.use(passport.initialize());
app.use(passport.session())
//Schemas:

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    director: { type: String, required: true },
    year: Number,
    duration: Number,
    rating: { type: Number, min: 1, max: 10 },
    review: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})

const Movie = mongoose.model("Movie", movieSchema);

const userSchema = new mongoose.Schema({
    githubID: { type: String, required: false, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    email: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", userSchema);

//git routing

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email']}))

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        if (req.isAuthenticated()) {
            req.session.username = req.user.username;
            req.session.save((err) => {
                if (err) {
                    console.log("Session could not be saved:", err);
                }
            })
            console.log("Authenticated user:", req.user);
            res.redirect('/');
        } else {
            console.log("Authentication failed!");
            res.redirect('/login');
        }
    })

passport.use(new GitHubStrategy({
        clientID: 'Ov23liPRI5v2GTqKxlv0',
        clientSecret: '70cb4682418d04fa3d3636fe340c01da73867445',
        callbackURL: 'http://localhost:3000/auth/github/callback', // Update for glitch
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubID: profile.id });
            if (!user) {
                user = new User({
                    githubID: profile.id,
                    username: profile.username,
                    email: profile.emails && profile.emails[0].value,  // Check for email
                });
                await user.save();
            }
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }));

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async(id, done) => {
    const user = await User.findById(id)
    done(null, user)
})

app.get('/', (req, res) => {
    if (req.isAuthenticated() || req.session.username) {
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
        if (req.isAuthenticated()) {
            req.session.destroy((err) => {
                if (err) {
                    console.log("Error destroying session:", err);
                }
                console.log("GitHub session cleared!");
            });
        }
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.username = username;
        req.session.save((err) => {
            if (err) {
                console.log("Error saving session:", err);
            }
            console.log("Session after local login:", req.session);
            res.json({ success: true });
        });
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
            const userMovies = await Movie.find({ user: user._id}).sort({ title: 1 });
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
        return res.status(401).json({ error: 'User not logged in!' });
    }
});

app.get('/api/movies', async (req, res) => {
    const username = req.session.username;

    if (req.isAuthenticated()) {
        const user = req.user;
        try {
            const movies = await Movie.find({ user: user._id }).sort({ title: 1 });
            return res.json(movies);
        } catch (err) {
            console.error('Error fetching movies:', err);
            return res.status(500).send('Failed to fetch movies');
        }
    } else if (username) {

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }
        try {
            const movies = await Movie.find({ user: user._id }).sort({ title: 1 });
            return res.json(movies);
        } catch (err) {
            console.error('Error fetching movies:', err);
            return res.status(500).send('Failed to fetch movies!');
        }
    } else {
        return res.status(401).json({ error: 'User not logged in.' });
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
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({error: 'User not found!'});
        }
        const newMovie = new Movie({title, director, year, duration, rating, review, user: user._id });
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
    const username = req.session.username;

    if (req.isAuthenticated()) {

        const user = req.user;
        try {
            const movie = await Movie.findOneAndDelete({ _id: movieId, user: user._id });
            if (!movie) {
                return res.status(404).json({ error: 'Movie not found!' });
            }
            res.json({ message: 'Movie deleted successfully!' });
        } catch (err) {
            res.status(500).send('Could not delete movie!');
        }
    } else if (username) {

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        try {
            const movie = await Movie.findOneAndDelete({ _id: movieId, user: user._id });
            if (!movie) {
                return res.status(404).json({ error: 'Movie not found!' });
            }
            res.json({ message: 'Movie deleted successfully!' });
        } catch (err) {
            res.status(500).send('Could not delete movie!');
        }
    } else {
        return res.status(401).json({ error: 'User not logged in.' });
    }
});


// process.env.PORT references the port that Glitch uses
// the following line will either use the Glitch port or one that we provided
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

//server.listen( process.env.PORT || port )


