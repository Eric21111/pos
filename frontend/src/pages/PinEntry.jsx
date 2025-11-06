import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import bgImage from '../assets/bg.png';
import tempStaff from '../assets/tempstaff.png';

const PinEntry = () => {
  const [pin, setPin] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

 
  const staffInfo = location.state?.staff || {
    id: 1,
    name: 'Staff 1',
    image: tempStaff
  };

  const handleNumberClick = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = () => {
    if (pin.length === 4) {
      // Store user info in auth context
      login(staffInfo);
      console.log(`Logging in ${staffInfo.name} with PIN: ${pin}`);
      
      // Redirect owner to dashboard, others to terminal
      if (staffInfo.name === 'owner' || staffInfo.id === 3) {
        navigate('/dashboard');
      } else {
        navigate('/terminal');
      }
    } else {
      alert('Please enter a 4-digit PIN');
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
     
      if (event.key >= '0' && event.key <= '9') {
        handleNumberClick(event.key);
      }

      else if (event.key === 'Backspace' || event.key === 'Delete') {
        handleBackspace();
      }
    
      else if (event.key === 'Enter') {
        handleLogin();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [pin]); 

  return (
    <div className="flex w-screen h-screen overflow-hidden flex-col lg:flex-row">
     
      <div className="flex-1 relative flex items-center justify-center p-8 min-h-[40vh] lg:min-h-full" style={{ backgroundColor: '#F5F5F5' }}>
        
        <div 
          className="absolute inset-8 lg:inset-8 rounded-[20px] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 115, 85, 0.7), rgba(139, 115, 85, 0.7)), url(${bgImage})`
          }}
        />
      
        <div className="relative z-10 text-center p-12 flex items-center justify-center">
          <img 
            src={logo} 
            alt="Create Your Style" 
            className="max-w-[80%] lg:max-w-[70%] h-auto object-contain drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)]" 
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh] lg:min-h-full" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="w-full max-w-[600px]">
         
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-[#8B7355] mb-4 tracking-[8px]">CYSPOS</h2>
            <div className="w-full h-0 pb-6 border-b-[3px] border-[#8B7355]"></div>
          </div>

          <div className={`flex items-start gap-12 transition-all duration-500 ${showKeypad ? 'justify-center' : 'justify-center'}`}>
            
            <div className={`flex flex-col items-center transition-all duration-500 ${showKeypad ? 'mt-10' : 'mt-0'}`}>
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden mb-4">
                <img 
                  src={staffInfo.image} 
                  alt={staffInfo.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'sans-serif' }}>{staffInfo.name}</p>
              <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'sans-serif' }}>Enter your PIN</p>
              
             
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm"
                  >
                    {index < pin.length && (
                      <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowKeypad(!showKeypad)}
                className="text-[#8B7355] text-sm font-semibold cursor-pointer hover:text-[#6d5a43] transition-colors duration-200 mb-4"
                style={{ fontFamily: 'sans-serif' }}
              >
                {showKeypad ? 'Hide Keypad' : 'Show Keypad'}
              </button>
            </div>

            <div className={`flex flex-col items-center transition-all duration-500 overflow-hidden ${showKeypad ? 'opacity-100 max-w-[280px]' : 'opacity-0 max-w-0'}`}>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((number) => (
                  <button
                    key={number}
                    onClick={() => handleNumberClick(number.toString())}
                    className="w-16 h-16 rounded-full bg-white text-gray-900 text-2xl font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-95"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    {number}
                  </button>
                ))}
                <div className="w-16 h-16"></div>
                <button
                  onClick={() => handleNumberClick('0')}
                  className="w-16 h-16 rounded-full bg-white text-gray-900 text-2xl font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-95"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="w-16 h-16 rounded-full bg-white text-gray-900 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-95 flex items-center justify-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              
              {showKeypad && (
                <button 
                  className="bg-[#8B7355] text-white border-none rounded-full px-20 py-3 text-lg font-semibold cursor-pointer transition-all duration-300 uppercase shadow-md hover:bg-[#6d5a43] hover:shadow-lg active:translate-y-0.5"
                  onClick={handleLogin}
                  style={{ fontFamily: 'sans-serif' }}
                >
                  LOGIN
                </button>
              )}
            </div>
          </div>

          
          {!showKeypad && (
            <div className="text-center mt-8 mr-10">
              <button 
                className="bg-[#8B7355] text-white border-none rounded-[10px] px-20 py-3 text-lg font-semibold cursor-pointer transition-all duration-300 uppercase shadow-md hover:bg-[#6d5a43] hover:shadow-lg active:translate-y-0.5"
                onClick={handleLogin}
                style={{ fontFamily: 'sans-serif' }}
              >
                LOGIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinEntry;


