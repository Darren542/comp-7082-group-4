import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
            <h1>404 Not Found</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="text-blue-600 pointer">
              Go back to the homepage
            </Link>
        </div>
    )
}