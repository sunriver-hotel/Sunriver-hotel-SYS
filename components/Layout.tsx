import React, { useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { HomeIcon, BedIcon, ChartIcon, MopIcon, ReceiptIcon, SunriverLogo, LogoutIcon } from './Icons';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!context) return null;
  const { activePage, setActivePage, t, logout, customLogo, setCustomLogo } = context;

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const navItems = [
    { id: 'home', label: t('home'), icon: <HomeIcon /> },
    { id: 'room_status', label: t('room_status'), icon: <BedIcon /> },
    { id: 'dashboard', label: t('dashboard'), icon: <ChartIcon /> },
    { id: 'cleaning', label: t('cleaning'), icon: <MopIcon /> },
    { id: 'receipt', label: t('receipt'), icon: <ReceiptIcon /> },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activePage === item.id;
    const baseClasses = "flex items-center justify-start p-3 my-1 rounded-lg transition-colors duration-200";
    const activeClasses = "bg-sunriver-yellow text-white shadow-md";
    const inactiveClasses = "text-gray-600 hover:bg-sunriver-yellow-light hover:text-gray-800";
    
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActivePage(item.id);
        }}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        <div className="w-6 h-6">{item.icon}</div>
        <span className="hidden md:inline-block ml-4 font-medium">{item.label}</span>
      </a>
    );
  };
  
  const MobileNavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activePage === item.id;
    return (
        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 flex-1 ${isActive ? 'text-sunriver-yellow' : 'text-gray-500 hover:text-sunriver-yellow'}`} >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-xs mt-1 text-center">{item.label}</span>
        </a>
    );
  };

  return (
    <div className="flex h-screen bg-stone-50 text-stone-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 p-4 transition-all duration-300">
        <div className="flex items-center mb-8">
          <SunriverLogo src={customLogo} className="h-12 w-12 text-sunriver-yellow object-contain" />
          <div className="ml-3">
             <h1 className="text-xl font-bold">{t('sunriver_hotel')}</h1>
             <p className="text-sm text-stone-500 mb-1">{t('management_system')}</p>
             <button onClick={triggerFileUpload} className="text-xs text-sunriver-yellow hover:underline">
                {t('upload_new_logo')}
             </button>
             <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
          </div>
        </div>
        <nav className="flex-grow">
          {navItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>
        <div>
           <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-red-100 hover:text-red-700"
          >
            <div className="w-6 h-6"><LogoutIcon/></div>
            <span className="ml-4 font-medium">{t('logout')}</span>
          </a>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around p-1 z-20 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
        {navItems.map(item => <MobileNavLink key={item.id} item={item} />)}
        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 flex-1 text-gray-500 hover:text-red-600">
            <div className="w-6 h-6"><LogoutIcon /></div>
            <span className="text-xs mt-1">{t('logout')}</span>
        </a>
      </nav>
    </div>
  );
};

export default Layout;