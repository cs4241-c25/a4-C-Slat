import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// MongoDB connection
const uri = "mongodb+srv://ctslattery:l7CpTIWrBZuDKZdG@cs4241.3i466.mongodb.net/?retryWrites=true&w=majority&appName=cs4241";
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const app = express();

// Middleware Setup
//need cors for multiroute
app.use(cors({
    origin: 'http://localhost:5175',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: 'spooky-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

//  Schemas
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    director: { type: String, required: true },
    year: Number,
    duration: Number,
    rating: { type: Number, min: 1, max: 10 },
    review: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});
const Movie = mongoose.model("Movie", movieSchema);

const userSchema = new mongoose.Schema({
    githubID: { type: String, required: false, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    email: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

// GitHub authentication routes
passport.use(new GitHubStrategy({
        clientID: 'Ov23liPRI5v2GTqKxlv0',
        clientSecret: '70cb4682418d04fa3d3636fe340c01da73867445',
        callbackURL: 'http://localhost:3000/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubID: profile.id });
            if (!user) {
                user = new User({
                    githubID: profile.id,
                    username: profile.username,
                    email: profile.emails && profile.emails[0].value,
                });
                await user.save();
            }
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Routes
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

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        if (req.isAuthenticated()) {
            req.session.username = req.user.username;
            req.session.save((err) => {
                if (err) {
                    console.log("Session could not be saved:", err);
                }
            });
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    });

// Login Route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (req.isAuthenticated()) {
            req.session.destroy((err) => {
                if (err) {
                    console.log("Error destroying session:", err);
                }
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
            res.json({ success: true });
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Movie Routes
app.get('/movie/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            res.send(`
                <html lang="en">
                    <head><title> Movie Info: </title></head>
                    <body><h1>Movie: ${movie.title}</h1>
                    <p>Director: ${movie.director}</p>
                    <p>Year: ${movie.year}</p>
                    <p>Duration: ${movie.duration} minutes</p>
                    <p>Rating: ${movie.rating || 'N/A'}</p>
                    <p>Review: ${movie.review || 'N/A'}</p></body>
                </html>
            `);
        } else {
            res.status(404).send('Movie not found!');
        }
        // eslint-disable-next-line no-unused-vars
    } catch (err) {
        res.status(500).send('Could not fetch movie info!');
    }
});

app.post('/api/movies', async (req, res) => {
    const { title, director, year, duration, rating, review } = req.body;
    const username = req.session.username;
    if (!username) {
        return res.status(401).json({ error: 'Log in to add movies!' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }
        const newMovie = new Movie({ title, director, year, duration, rating, review, user: user._id });
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (err) {
        console.error("Error saving movie:", err);
        res.status(500).send('Could not save movie info!');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

