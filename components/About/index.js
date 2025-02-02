/* eslint-disable @next/next/no-img-element */
import React, { useEffect } from 'react';
import Nav from './Nav'
import Introduce from './Introduce'
import Service from './Service'
import Privacy from './Privacy'
import { useRouter } from 'next/router';

const index = () => {
  const router = useRouter();
  return (
    <div className='p-0 m-0 bg-slate-100 min-h-[100vh] text-[#f9f9f9] overflow-x-hidden'>
      <Nav/>
      <div className='w-full max-w-[1200px] mx-auto'>
        {router?.pathname === "/about" ? <Introduce />
          : router?.pathname === "/about/Privacy" ? <Privacy />
            : router?.pathname === "/about/Service" ? <Service />
                  : null
        }
      </div>
    </div>

  );
};


export default index;