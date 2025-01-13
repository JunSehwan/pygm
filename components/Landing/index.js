import React, { useEffect } from 'react';
import TopSection from './TopSection';
import LoginForm from './LoginForm';


const index = () => {

  return (
    // <Navbar>
    <div className='max-w-md mx-auto pt-[var(--navbar-height)] md:px-2 pb-4 md:pb-auto flex flex-col min-h-screen overflow-hidden"'>
      <main className="flex-grow" >
        <TopSection />
        {/* <FeaturesHome /> */}
        {/* <Features /> */}
        <LoginForm />
        {/* <Newsletter /> */}
      </main >
      {/* <Footer /> */}
    </div>
    // </Navbar>
  );
};

export default index;