import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';
import Router from 'next/router';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id
    },
    onSuccess: (payment) => Router.push('/orders'),
  });

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    findTimeLeft(); // avoid waiting 1sc the first time
    const timerId = setInterval(findTimeLeft, 1000); // without () we dont want the result of findTimeLeft
    return () => {             // If we navegate away or stop showing the component
      clearInterval(timerId); 
    };
  }, [order]); // [] to ensure it only execute one time

  if(timeLeft < 0 ) {
    return <div>Order Expired</div>;
  }

  return (<div>
    Time left to pay: {timeLeft} seconds
    <StripeCheckout 
      token={({ id }) => doRequest({ token:id })} //we want to call doRequest to pass the token id
      stripeKey="pk_test_51NT28pByYZZFg3li6VLPtZaLmWs56PI6XyvDxdEF5AHDcXahMVzpoiLIglaYTMldxxCDjszyph1xs5cwIP2Ehsnm00xrqdHSML"
      amount={order.ticket.price * 100}
      email={currentUser.email}
    />
    {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data };
};

export default OrderShow;