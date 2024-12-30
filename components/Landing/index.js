import React from 'react';
import HeroHome from './HeroHome';
import FeaturesHome from './FeaturesHome';
import Features from './Features';
import Testimonials from './Testimonials';
import Footer from './Footer';
import Navbar from './Navbar';

const index = () => {
  return (
    <Navbar>
      <div className='pt-[var(--navbar-height)] md:px-8 pb-[70px] md:pb-auto flex flex-col min-h-screen overflow-hidden"'>
        <main className="flex-grow" >
          <HeroHome />
          {/* <FeaturesHome /> */}
          {/* <Features /> */}
          {/* <Testimonials /> */}
          {/* <Newsletter /> */}
        </main >
        {/* <Footer /> */}
      </div>
    </Navbar>
  );
};

export default index;