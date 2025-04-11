import React from 'react';

const index = () => {
  return (
    <section className='w-full py-6 md:py-16 bg-black'>
      <div className='w-full flex justify-center'>
        <div className='max-w-[320px]'
          data-aos="zoom-y-out"
          data-aos-delay={300}>
          <video className="w-full" autoPlay loop muted controls>
            <source src="/image/service.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
};

export default index;