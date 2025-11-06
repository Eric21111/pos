import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import bgImage from '../assets/bg.png';
import tempStaff from '../assets/tempstaff.png';

const StaffSelection = () => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isScrollingRef = useRef(false);
  const hasMovedRef = useRef(false);

  const staffMembers = [
    { id: 1, name: 'Staff 1', image: tempStaff },
    { id: 2, name: 'Staff 2', image: tempStaff },
    { id: 3, name: 'owner', image: tempStaff }
  ];

  const infiniteStaffMembers = [
    ...staffMembers,
    ...staffMembers,
    ...staffMembers,
    ...staffMembers,
    ...staffMembers
  ];

  const handleStaffSelect = (staffId, cardElement) => {
   
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    
    setSelectedStaff(staffId);
    
  
    if (cardElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardRect = cardElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const cardCenter = cardRect.left + (cardRect.width / 2);
      const containerCenter = containerRect.left + (containerRect.width / 2);
      const scrollOffset = cardCenter - containerCenter;
      

      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'smooth';
      
   
      container.scrollTo({
        left: container.scrollLeft + scrollOffset,
        behavior: 'smooth'
      });
      
      
      setTimeout(() => {
        container.style.scrollSnapType = 'x mandatory';
      }, 600);
    }
  };

  const handleProceed = () => {
    if (selectedStaff) {
      const selectedStaffMember = staffMembers.find(s => s.id === selectedStaff);
      console.log(`Proceeding with ${selectedStaffMember.name}`);

      navigate('/pin', { state: { staff: selectedStaffMember } });
    } else {
      alert('Please select a staff member');
    }
  };


  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.scrollBehavior = 'auto';
    scrollContainerRef.current.style.scrollSnapType = 'none'; 
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2; 
    
 
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = false;
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.scrollBehavior = 'smooth';
    scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
  };

  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    scrollContainerRef.current.style.cursor = 'grab';
    if (wasDragging) {
      scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
    }
  };


  const handleTouchStart = (e) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.scrollBehavior = 'auto';
    scrollContainerRef.current.style.scrollSnapType = 'none'; 
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2; 
    
   
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchEnd = () => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = false;
    scrollContainerRef.current.style.scrollBehavior = 'smooth';
    scrollContainerRef.current.style.scrollSnapType = 'x mandatory'; 
  };


  const handleInfiniteScroll = useCallback(() => {
    if (!scrollContainerRef.current || isScrollingRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    

    const oneSetWidth = scrollWidth / 5;
   
    if (scrollLeft >= oneSetWidth * 4) {
      isScrollingRef.current = true;
      const snapType = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = scrollLeft - oneSetWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.style.scrollBehavior = 'smooth';
          container.style.scrollSnapType = snapType;
          isScrollingRef.current = false;
        });
      });
    }
    
    else if (scrollLeft <= oneSetWidth * 1) {
      isScrollingRef.current = true;
      const snapType = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = scrollLeft + oneSetWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.style.scrollBehavior = 'smooth';
          container.style.scrollSnapType = snapType;
          isScrollingRef.current = false;
        });
      });
    }
  }, []);

  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.style.scrollBehavior = 'auto';
      container.style.cursor = 'grab';
      
    
      requestAnimationFrame(() => {
        const oneSetWidth = container.scrollWidth / 5;
        container.scrollLeft = oneSetWidth * 2; 
        requestAnimationFrame(() => {
          container.style.scrollBehavior = 'smooth';
        });
      });
      
      
      container.addEventListener('scroll', handleInfiniteScroll, { passive: true });
      
      return () => {
        container.removeEventListener('scroll', handleInfiniteScroll);
      };
    }
  }, [handleInfiniteScroll]);

  return (
    <div className="flex w-screen h-screen overflow-hidden flex-col lg:flex-row">
     
      <div className="flex-1 relative flex items-center justify-center p-8 bg-white min-h-[40vh] lg:min-h-full">
        
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

     
      <div className="flex-1 bg-white flex items-center justify-center p-8 min-h-[60vh] lg:min-h-full">
        <div className="w-full max-w-[500px] text-center">
          <h2 className="text-5xl font-bold text-[#8B7355] mb-4 tracking-[8px]">CYSPOS</h2>
          <p className="text-base text-gray-800 mb-12 pb-6 border-b-[3px] border-[#8B7355]">
            Please select your account
          </p>
         
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto overflow-y-visible my-12 scrollbar-hide select-none mx-auto"
            style={{
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none', 
              WebkitOverflowScrolling: 'touch', 
              maxWidth: '456px', 
              width: '100%',
              scrollSnapType: 'x mandatory', 
              scrollPaddingLeft: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                will-change: scroll-position;
              }
              @media (prefers-reduced-motion: no-preference) {
                .scrollbar-hide {
                  scroll-behavior: smooth;
                }
              }
            `}</style>
            
           
            <div className="flex gap-8 px-4 py-4">
              {infiniteStaffMembers.map((staff, index) => (
                <div
                  key={`staff-${staff.id}-${index}`}
                  className="shrink-0 cursor-pointer text-center"
                  onClick={(e) => handleStaffSelect(staff.id, e.currentTarget)}
                  style={{ 
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    willChange: 'transform',
                    paddingTop: '8px',
                    paddingBottom: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStaff !== staff.id) {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStaff !== staff.id) {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    }
                  }}
                >
                  <div 
                    className={`w-[120px] h-[120px] rounded-full overflow-hidden mx-auto mb-4 bg-gray-100 ${
                      selectedStaff === staff.id 
                        ? 'border-[4px] border-[#8B7355] shadow-[0_8px_20px_rgba(139,115,85,0.5)]' 
                        : 'border-[2px] border-gray-300'
                    }`}
                    style={{ 
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedStaff === staff.id ? 'scale(1.1)' : 'scale(1)',
                      willChange: 'transform, box-shadow, border-color',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStaff !== staff.id) {
                        e.currentTarget.style.borderColor = '#8B7355';
                        e.currentTarget.style.borderWidth = '3px';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,115,85,0.3)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStaff !== staff.id) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.borderWidth = '2px';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <img 
                      src={staff.image} 
                      alt={staff.name}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable="false"
                    />
                  </div>
                  <p className="text-base font-semibold text-gray-800 m-0 whitespace-nowrap">
                    {staff.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="bg-[#8B7355] text-white border-none rounded-lg px-16 py-4 text-lg font-semibold cursor-pointer transition-all duration-300 mt-8 capitalize hover:bg-[#6d5a43] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,115,85,0.3)] active:translate-y-0 w-full md:w-auto"
            onClick={handleProceed}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSelection;

