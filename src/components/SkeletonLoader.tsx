import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-gray-200 rounded-lg"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
