import React, { useState, useEffect } from 'react';
import Login from './Login';
import MovieForm from './MovieForm';
import MovieTable from './MovieTable';
import './App.css';
import './main.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [movies, setMovies] = useState([]);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    useEffect(() => {
        if (isLoggedIn) {
            const fetchMovies = async () => {
                try {
                    const response = await fetch('/api/movies');
                    if (response.ok) {
                        const data = await response.json();
                        setMovies(data);
                    } else {
                        console.error("Failed to fetch movies.");
                    }
                } catch (error) {
                    console.error("Error fetching movies:", error);
                }
            };
            fetchMovies();
        }
    }, [isLoggedIn]);

    const addMovie = async (movie) => {
        try {
            const response = await fetch('/api/movies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movie),
            });

            if (response.ok) {
                const updatedMoviesResponse = await fetch('/api/movies');
                const updatedMovies = await updatedMoviesResponse.json();
                setMovies(updatedMovies);
            } else {
                console.error("Failed to add movie");
            }
        } catch (error) {
            console.error("Error adding movie:", error);
        }
    };

    const deleteMovie = async (index) => {
        const movieToDelete = movies[index];
        try {
            const response = await fetch(`/api/movies/${movieToDelete.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setMovies(movies.filter((_, i) => i !== index));
            } else {
                console.error("Failed to delete movie");
            }
        } catch (error) {
            console.error("Error deleting movie:", error);
        }
    };
    return (
        <div className="container my-5">
            <main>
                {isLoggedIn ? (
                    <>
                        <MovieForm addMovie={addMovie} />
                        <MovieTable movies={movies} deleteMovie={deleteMovie} />
                    </>
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </main>
        </div>
    );
}

export default App;
