import React from 'react';
import "../../public/logo.svg";

const Header = () => {
  return (
    <header className=' flex flex-col justify-center items-center h-60 bg-gray-100'>
      <img src="/logo.svg" alt="Logomarca" className="w-40 h-20" />
      <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-xl mb-2 font-bold text-blue-900 mt-4">Ouvidoria Inteligente</h1>
    </header>
  );
};

export default Header;