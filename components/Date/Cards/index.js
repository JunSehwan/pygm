import React from 'react';
import UpperDescription from './UpperDescription';
import ProfileCards from './ProfileCards';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <>
      <div className="flex min-h-[100vh] w-full bg-gradient-to-b from-gray-50 via-white to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto w-full max-w-[420px] p-4"
        >
          <div className="w-full pt-[var(--navbar-height)] pb-[24px] md:pb-auto">
            {/* 상단 설명 영역 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <UpperDescription />
            </motion.div>

            {/* 프로필 카드 리스트 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-4"
            >
              <ProfileCards />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* 토스트 스타일 */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            color: '#fff',
            background: 'rgba(0,0,0,0.8)',
            fontSize: '0.95rem',
            borderRadius: '10px',
            padding: '12px 16px',
          },
        }}
      />
    </>
  );
};

export default Index;
