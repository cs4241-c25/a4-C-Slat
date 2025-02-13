import React, { useState } from "react";

const MovieForm = ({ addMovie }) => {
    const [movieData, setMovieData] = useState({
        title: "",
        director: "",
        year: "",
        duration: "",
        rating: "",
        review: "",
    });

    // Handle form input changes
    const handleChange = (e) => {
        setMovieData({
            ...movieData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        addMovie(movieData);

        const response = await fetch("/api/movies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(movieData),
        });

        if (response.ok) {
            console.log("Movie added successfully!");
        } else {
            console.error("Failed to save movie!");
        }

        setMovieData({
            title: "",
            director: "",
            year: "",
            duration: "",
            rating: "",
            review: "",
        });
    };

    return (
        <section className="form-section mb-5">
            <h2 className="text-center mb-4">Add a Movie!</h2>
            <h3 className="text-center mb-3">Required Fields</h3>
            <form id="movie-form" onSubmit={handleSubmit}>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="title" className="form-label">Title:</label>
                        <input
                            type="text"
                            id="title"
                            className="form-control"
                            placeholder="Title"
                            value={movieData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="director" className="form-label">Director:</label>
                        <input
                            type="text"
                            id="director"
                            className="form-control"
                            placeholder="Director"
                            value={movieData.director}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="year" className="form-label">Year:</label>
                        <input
                            type="number"
                            id="year"
                            className="form-control"
                            placeholder="Year"
                            min="1888"
                            max="2025"
                            value={movieData.year}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="duration" className="form-label">Duration:</label>
                        <input
                            type="number"
                            id="duration"
                            className="form-control"
                            placeholder="Duration (minutes)"
                            min="1"
                            max="999"
                            value={movieData.duration}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <h3 className="text-center mb-3">Optional Fields</h3>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="rating" className="form-label">Rating:</label>
                        <input
                            type="number"
                            id="rating"
                            className="form-control"
                            placeholder="Rating (1-10)"
                            min="1"
                            max="10"
                            value={movieData.rating}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="review" className="form-label">Review:</label>
                        <input
                            type="text"
                            id="review"
                            className="form-control"
                            placeholder="Review"
                            value={movieData.review}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="text-center">
                    <button type="submit" className="btn btn-primary">Add Movie</button>
                </div>
            </form>
        </section>
    );
};

export default MovieForm;
