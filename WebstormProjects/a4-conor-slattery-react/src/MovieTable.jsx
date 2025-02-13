import React from "react";

const MovieTable = ({ movies, deleteMovie }) => {
    return (
        <section className="movie-list-section">
            <h3 className="text-center mb-4">Movie List</h3>
            <table className="table table-bordered table-striped">
                <thead>
                <tr>
                    <th>Title</th>
                    <th>Director</th>
                    <th>Year</th>
                    <th>Duration</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Delete</th>
                </tr>
                </thead>
                <tbody>{movies.length === 0 ? (<tr>
                        <td colSpan="7" className="text-center">No movies available</td>
                    </tr>) : (movies.map((movie, index) => (
                        <tr key={index}>
                            <td>{movie.title}</td>
                            <td>{movie.director}</td>
                            <td>{movie.year}</td>
                            <td>{movie.duration}</td>
                            <td>{movie.rating || '-'}</td>
                            <td>{movie.review || '-'}</td>
                            <td>
                                <button onClick={() => deleteMovie(index)} className="btn btn-danger">Delete</button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </section>
    );
};

export default MovieTable;
