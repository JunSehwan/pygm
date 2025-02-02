import React from 'react';
import Alert from 'components/Common/Alert';

const index = () => {
  return (
    <div className='w-full my-2'>
      <Alert
        text="타인의 개인정보 유출(캡쳐, 공유 등)시, 법적책임이 가해질 수 있습니다."
        color="red"
        textsize="xs"
      />
    </div>
  );
};

export default index;