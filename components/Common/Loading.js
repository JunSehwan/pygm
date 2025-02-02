import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from "framer-motion";



function LoadingPage() {
  return (
    // Npm install framer-motion


    <div className="fixed inset-0 z-50 flex items-center justify-center space-x-3">
      <motion.div
        className="w-6 h-6 bg-[--pygm-one] rounded-full"
        animate={{ y: [-10, 0, -10], opacity: [50, 100, 50] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="w-6 h-6 bg-[--pygm-three] rounded-full"
        animate={{ y: [0, -10, 0], opacity: [50, 100, 50] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="w-6 h-6 bg-[--pygm-five] rounded-full"
        animate={{ y: [-10, 0, -10], opacity: [50, 100, 50] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
};
//     <LoadingBoxS>
//       <div id="loading">
//         <div className="loading_text">Loading...</div>
//         <div className="loading_icon"></div>
//       </div>
//     </LoadingBoxS>
//   );
// }

// const LoadingBoxS = styled.div`
//   #loading {
//     height: 100%;
//     width: 100%;
//     z-index: 1;
//     margin-top: 0px;
//     top: 0px;
//     z-index: 999999;
//     display: block;
//   }
//   .loading_text {
//     width: 120px;
//     height: 0px;
//     margin: auto;
//     position: absolute;
//     left: 0;
//     right: 0;
//     top: 0;
//     bottom: 0;
//     color: #454c53;
//     font-size: 20px;
//   }
//   .loading_icon {
//     width: 49px;
//     height: 140px;
//     margin: auto;
//     position: absolute;
//     left: 0;
//     right: 0;
//     top: 0;
//     bottom: 0;
//   }
//   .loading_icon:before {
//     content: '';
//     width: 49px;
//     height: 5px;
//     background: #000000;
//     opacity: 0.1;
//     position: absolute;
//     top: 58px;
//     left: 0;
//     border-radius: 50%;
//     animation: shadow 0.58s linear infinite;
//     -o-animation: shadow 0.58s linear infinite;
//     -ms-animation: shadow 0.58s linear infinite;
//     -webkit-animation: shadow 0.58s linear infinite;
//     -moz-animation: shadow 0.58s linear infinite;
//   }
//   .loading_icon:after {
//     content: '';
//     width: 49px;
//     height: 49px;
//     background: #fdd245;
//     position: absolute;
//     top: 0;
//     left: 0;
//     border-radius: 3px;
//     animation: cssload-animate 0.58s linear infinite;
//     -o-animation: cssload-animate 0.58s linear infinite;
//     -ms-animation: cssload-animate 0.58s linear infinite;
//     -webkit-animation: cssload-animate 0.58s linear infinite;
//     -moz-animation: cssload-animate 0.58s linear infinite;
//   }
//   @keyframes cssload-animate {
//     17% {
//       border-bottom-right-radius: 3px;
//     }
//     25% {
//       transform: translateY(9px) rotate(22.5deg);
//     }
//     50% {
//       transform: translateY(18px) scale(1, 0.9) rotate(45deg);
//       border-bottom-right-radius: 39px;
//     }
//     75% {
//       transform: translateY(9px) rotate(67.5deg);
//     }
//     100% {
//       transform: translateY(0) rotate(90deg);
//     }
//   }
//   @-o-keyframes cssload-animate {
//     17% {
//       border-bottom-right-radius: 3px;
//     }
//     25% {
//       -o-transform: translateY(9px) rotate(22.5deg);
//     }
//     50% {
//       -o-transform: translateY(18px) scale(1, 0.9) rotate(45deg);
//       border-bottom-right-radius: 39px;
//     }
//     75% {
//       -o-transform: translateY(9px) rotate(67.5deg);
//     }
//     100% {
//       -o-transform: translateY(0) rotate(90deg);
//     }
//   }
//   @-ms-keyframes cssload-animate {
//     17% {
//       border-bottom-right-radius: 3px;
//     }
//     25% {
//       -ms-transform: translateY(9px) rotate(22.5deg);
//     }
//     50% {
//       -ms-transform: translateY(18px) scale(1, 0.9) rotate(45deg);
//       border-bottom-right-radius: 39px;
//     }
//     75% {
//       -ms-transform: translateY(9px) rotate(67.5deg);
//     }
//     100% {
//       -ms-transform: translateY(0) rotate(90deg);
//     }
//   }
//   @-webkit-keyframes cssload-animate {
//     17% {
//       border-bottom-right-radius: 3px;
//     }
//     25% {
//       -webkit-transform: translateY(9px) rotate(22.5deg);
//     }
//     50% {
//       -webkit-transform: translateY(18px) scale(1, 0.9) rotate(45deg);
//       border-bottom-right-radius: 39px;
//     }
//     75% {
//       -webkit-transform: translateY(9px) rotate(67.5deg);
//     }
//     100% {
//       -webkit-transform: translateY(0) rotate(90deg);
//     }
//   }
//   @-moz-keyframes cssload-animate {
//     17% {
//       border-bottom-right-radius: 3px;
//     }
//     25% {
//       -moz-transform: translateY(9px) rotate(22.5deg);
//     }
//     50% {
//       -moz-transform: translateY(18px) scale(1, 0.9) rotate(45deg);
//       border-bottom-right-radius: 39px;
//     }
//     75% {
//       -moz-transform: translateY(9px) rotate(67.5deg);
//     }
//     100% {
//       -moz-transform: translateY(0) rotate(90deg);
//     }
//   }
//   @keyframes shadow {
//     0%,
//     100% {
//       transform: scale(1, 1);
//     }
//     50% {
//       transform: scale(1.2, 1);
//     }
//   }
//   @-o-keyframes shadow {
//     0%,
//     100% {
//       -o-transform: scale(1, 1);
//     }
//     50% {
//       -o-transform: scale(1.2, 1);
//     }
//   }
//   @-ms-keyframes shadow {
//     0%,
//     100% {
//       -ms-transform: scale(1, 1);
//     }
//     50% {
//       -ms-transform: scale(1.2, 1);
//     }
//   }
//   @-webkit-keyframes shadow {
//     0%,
//     100% {
//       -webkit-transform: scale(1, 1);
//     }
//     50% {
//       -webkit-transform: scale(1.2, 1);
//     }
//   }
//   @-moz-keyframes shadow {
//     0%,
//     100% {
//       -moz-transform: scale(1, 1);
//     }
//     50% {
//       -moz-transform: scale(1.2, 1);
//     }
//   }
// `;

export default LoadingPage;