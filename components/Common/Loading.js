import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from "framer-motion";
import { GiHeartStake } from "react-icons/gi";



function LoadingPage() {
  return (
    // Npm install framer-motion
    <section className="relative place-items-center grid h-screen w-screen gap-4">
      <div className="bg-pink-500 w-48 h-48  absolute animate-ping rounded-full delay-5s shadow-xl"></div>
      <div className="bg-pink-400 w-32 h-32 absolute animate-ping rounded-full shadow-xl"></div>
      <div className="bg-white w-24 h-24 absolute animate-pulse rounded-full shadow-xl"></div>
      <GiHeartStake
        className="text-pink-900 filter mix-blend-overlay h-16 w-16" 
        />
      {/* <svg xmlns="http://www.w3.org/2000/svg" className="text-pink-900 filter mix-blend-overlay h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg> */}
    </section>

    // <div className="fixed inset-0 z-50 flex items-center justify-center space-x-3">
    //   <motion.div
    //     className="w-6 h-6 bg-[--pygm-one] rounded-full"
    //     animate={{ y: [-10, 0, -10], opacity: [50, 100, 50] }}
    //     transition={{ duration: 1.5, repeat: Infinity }}
    //   />
    //   <motion.div
    //     className="w-6 h-6 bg-[--pygm-three] rounded-full"
    //     animate={{ y: [0, -10, 0], opacity: [50, 100, 50] }}
    //     transition={{ duration: 1.5, repeat: Infinity }}
    //   />
    //   <motion.div
    //     className="w-6 h-6 bg-[--pygm-five] rounded-full"
    //     animate={{ y: [-10, 0, -10], opacity: [50, 100, 50] }}
    //     transition={{ duration: 1.5, repeat: Infinity }}
    //   />
    // </div>
  );
};

export default LoadingPage;