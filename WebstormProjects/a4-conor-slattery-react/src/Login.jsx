import { useState } from 'react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!username || !password) {
            setError('Please enter both a username and password!');
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            if (response.ok) {
                localStorage.setItem('username', username);
                window.location.href = '/movies';
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <header className="text-center mb-4">
                    <h1>Login to Movie Logger!</h1>
                </header>
                <main>
                    <section className="form-section">
                        <h2 className="text-center mb-4">Login</h2>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form id="login-form" onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Username:</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="form-control"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Login</button>
                        </form>
                        <hr />
                        <div className="text-center">
                            <a href="/auth/github" className="btn btn-dark w-100">
                                Login with GitHub
                            </a>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
