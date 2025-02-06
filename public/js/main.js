// FRONT-END (CLIENT) JAVASCRIPT HERE

const submit = async function( event ) {
    // stop form submission from trying to load
    // a new .html page for displaying results...
    // this was the original browser behavior and still
    // remains to this day
    event.preventDefault()


   //movie table info

    const input = {
        title: document.querySelector("#movie-title").value,
        director: document.querySelector("#movie-director").value,
        year: document.querySelector("#movie-year").value,
        duration: document.querySelector("#movie-duration").value,
        rating: document.querySelector("#movie-rating").value,
        review: document.querySelector("#movie-review").value
    }

    //fetches movie api with POST
    const response = await fetch("/api/movies", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
    })

    
    const moviesResponse = await fetch("/api/movies") // after adding/updating a movie fetches the full list
    const movies = await moviesResponse.json()
    refreshMovieTable(movies)

    // Clear the form
    document.querySelector("#movie-form").reset()
}

//updates table after additions
function refreshMovieTable(movies) {
    const tbody = document.querySelector("#movie-table-body")
    tbody.innerHTML = '' // Clear current table

    movies.forEach(movie => {
        const row = document.createElement("tr")
        row.innerHTML = `
            <td>${movie.title}</td>
            <td>${movie.director}</td>
            <td>${movie.year}</td>
            <td>${movie.duration}</td>
            <td>${movie.rating || '-'}</td>
            <td>${movie.review || '-'}</td>
        `
        tbody.appendChild(row)
    })
}

//probably need this to include userID at some point to check what movies should be in here
window.onload = async function() { //load existing movies when page loads
    const form = document.querySelector("#movie-form")
    form.onsubmit = submit

    const response = await fetch("/api/movies") //fetch and display existing movies
    const movies = await response.json()
    refreshMovieTable(movies)
}
