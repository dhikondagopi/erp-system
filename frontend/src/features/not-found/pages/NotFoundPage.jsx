import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="rounded-full bg-slate-900 p-6 border border-slate-800 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Resource Not Found</h1>
        <p className="text-slate-400 font-medium max-w-md">The page URL or resource index you are trying to visit does not exist.</p>
      </div>
      <Link to="/" className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all text-white font-semibold rounded-lg text-sm shadow-md">
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
