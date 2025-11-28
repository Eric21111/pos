import React from 'react';

const PrintingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
  <div
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 font-poppins p-4"
      >
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          {/* Printer Icon with Animation */}
          <div className="relative mb-6">
            <svg
              className="w-24 h-24 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            
            {/* Paper Animation */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div 
                className="w-12 h-16 bg-white border-2 border-gray-400 rounded"
                style={{
                  animation: 'paperPrint 2s ease-in-out infinite'
                }}
              >
                <div className="h-2 bg-gray-300 mt-2 mx-2 rounded"></div>
                <div className="h-1 bg-gray-300 mt-1 mx-2 rounded"></div>
                <div className="h-1 bg-gray-300 mt-1 mx-2 rounded"></div>
              </div>
            </div>
          </div>

          {/* Loading Dots */}
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Printing
            <span className="inline-flex ml-1">
              <span 
                className="animate-bounce inline-block"
                style={{ animationDelay: '0ms' }}
              >.</span>
              <span 
                className="animate-bounce inline-block"
                style={{ animationDelay: '150ms' }}
              >.</span>
              <span 
                className="animate-bounce inline-block"
                style={{ animationDelay: '300ms' }}
              >.</span>
            </span>
          </h3>

          {/* Progress Bar */}
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{
                animation: 'progressBar 3s ease-in-out infinite'
              }}
            ></div>
          </div>

          <p className="text-sm text-gray-600 mt-3">Please wait while we print your receipt</p>
        </div>

        <style>{`
          @keyframes paperPrint {
            0%, 100% {
              transform: translateY(0) translateX(-50%);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            50% {
              transform: translateY(40px) translateX(-50%);
              opacity: 1;
            }
            80% {
              transform: translateY(40px) translateX(-50%);
              opacity: 0;
            }
          }

          @keyframes progressBar {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PrintingModal;
