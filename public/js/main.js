// FRONT-END (CLIENT) JAVASCRIPT HERE


async function checkLoginStatus() {
    const response = await fetch("/user-profile", {
        method: 'GET',
    });

    if (response.status === 200) {
        const userData = await response.json();
        return userData;
    } else if (response.status === 401) {

        window.location.href = '/login';
    } else {

        console.error("Failed to fetch user profile");
        window.location.href = '/login';
    }
}


async function getUserProfile() {
    const response = await fetch('/user-profile', {
        method: 'GET',
    });

    if (response.status === 401) {
        console.log("User is not logged in, redirecting to login.");
        window.location.href = '/login';
    } else if (response.ok) {
        const data = await response.json();
        console.log('User Profile:', data);
    } else {
        console.log("Error fetching user profile:", await response.text());
    }
}

const submit = async function (event) {
    event.preventDefault();

    const response = await fetch('/user-profile', { method: 'GET' });

    if (response.status === 401) {
        alert('Please log in first!');
        return;
    }
    const userData = await response.json();
    const username = userData.username;

    if (!username) {
        alert('Please log in first!');
        return;
    }

    // Movie form data
    const input = {
        title: document.querySelector("#movie-title").value,
        director: document.querySelector("#movie-director").value,
        year: document.querySelector("#movie-year").value,
        duration: document.querySelector("#movie-duration").value,
        rating: document.querySelector("#movie-rating").value,
        review: document.querySelector("#movie-review").value,
        user: username
    };

    const movieResponse = await fetch("/api/movies", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
    });

    if (movieResponse.ok) {
        const moviesResponse = await fetch("/api/movies");
        const movies = await moviesResponse.json();
        refreshMovieTable(movies);
    } else {
        console.error("Failed to save movie!");
    }

    document.querySelector("#movie-form").reset();
};

function refreshMovieTable(movies) {
    const tbody = document.querySelector("#movie-table-body");
    tbody.innerHTML = '';
    if (movies.length === 0) {
        console.log("No movies to display.");
        return;
    }

    movies.forEach(movie => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${movie.title}</td>
            <td>${movie.director}</td>
            <td>${movie.year}</td>
            <td>${movie.duration}</td>
            <td>${movie.rating || '-'}</td>
            <td>${movie.review || '-'}</td>
            <td><button class="delete-btn" data-id="${movie._id}">Delete</button></td>
        `;

        const deleteButton = row.querySelector(".delete-btn");
        deleteButton.addEventListener("click", async function () {
            const movieId = deleteButton.getAttribute("data-id");
            const username = localStorage.getItem('username');

            const deleteResponse = await fetch(`/api/movies/${movieId}`, {
                method: 'DELETE',
            });

            if (deleteResponse.ok) {
                const moviesResponse = await fetch("/api/movies");
                const movies = await moviesResponse.json();
                refreshMovieTable(movies);
            } else {
                console.error("Could not delete movie!");
            }
        });

        tbody.appendChild(row);
    });
}

window.onload = async function () {
    if (window.location.pathname !== '/login') {
        try {
            const user = await checkLoginStatus();

            if (user) {
                const form = document.querySelector("#movie-form");
                form.onsubmit = submit;

                const response = await fetch("/api/movies");
                const movies = await response.json();
                refreshMovieTable(movies);
            }
        } catch (error) {
            console.error("Error during login check:", error);
        }
    }
};
