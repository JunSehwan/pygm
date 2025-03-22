import React from 'react';
import Header from './Header';
import Hero from './Hero';
import DatingIntro from './DatingIntro';
import Video from './Video';
import Strength from './Strength';
import Process from './Process';
import ServiceCompare from './ServiceCompare';
import Targeting from './Targeting';
import LastOffer from './LastOffer';
import Footer from './Footer';

const index = () => {
  return (
    <div className='w-full h-full'>
      <Header />
      <Hero />
      <DatingIntro />
      <Video />
      <Strength />
      <Process />
      <ServiceCompare />
      <Targeting />
      <LastOffer />
      <Footer />
    </div>
  );
};

export default index;