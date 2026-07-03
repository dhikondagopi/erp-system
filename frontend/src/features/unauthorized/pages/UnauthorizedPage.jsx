import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="rounded-full bg-red-950/30 p-6 border border-red-800/40 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Access Unauthorized</h1>
        <p className="text-slate-400 font-medium max-w-md">Your user role does not possess the permissions required to view this directory.</p>
      </div>
      <Link to="/" className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all text-white font-semibold rounded-lg text-sm shadow-md">
        Return to Safety
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
