import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { OrderStatus } from '@anei/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payments';

// jest.mock('../../stripe');

it('retuns a 404 when purchasing an order that does not exist', async () => {
  await request(app).post('/api/payments').set('Cookie', global.signin())
  .send({
    token: 'asass',
    orderId: new mongoose.Types.ObjectId().toHexString(),
  })
  .expect(404);
});

it('return a 401 when purchasing an order that doesnt belong to the user', async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'asass',
      orderId: order.id,
    })
    .expect(401);

});

it('return a 400 when purchasing a cancelled order', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'asass',
      orderId: order.id,
    })
    .expect(400);

});

/*
// Relaying in Mock
it('return a 201 with valid inputs - with Mock', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);
 
    
// When using Mock    
// const chargeOption = (stripe.charges.create as jest.Mock).mock.calls[0][0];

  // expect(chargeOption.source).toEqual('tok_visa');
  // expect(chargeOption.amount).toEqual(20 *100);
  // expect(chargeOption.currency).toEqual('usd');
});
*/

// Relaying in Stripe API
it('return a 201 with valid inputs -- Stripe', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  // Random price to look for
  const price = Math.floor(Math.random() * 1000);

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);
    
  const stripeCharges = await stripe.charges.list({ limit: 50 });

  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id
  });

  // we cannot use toBeDefined for null values
  expect(payment).not.toBeNull();

});

