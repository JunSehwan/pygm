import React from 'react';
import TopSection from './TopSection';
import LoginForm from './LoginForm';


const index = () => {

  return (
    // <Navbar>
    <div className='max-w-md mx-auto pt-[var(--navbar-height)] md:px-2 pb-4 md:pb-auto flex flex-col min-h-screen overflow-hidden"'>
      <main className="flex-grow" >
        <TopSection />
        <LoginForm />
      </main >
    </div>
  );
};

export default index;