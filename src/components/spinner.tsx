import React from 'react';

export const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-16 w-16">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-dashed rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-pink-400 border-dashed rounded-full animate-spin-fast"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-dashed rounded-full animate-spin-slow"></div>
      </div>
    </div>
  );
};
