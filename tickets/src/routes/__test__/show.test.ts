import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import mongoose from 'mongoose';

it('it returns a 404 if the ticket is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .get(`/api/tickets/${id}`)
    .send()
    .expect(404);
});

it('it returns the ticket if the ticket is found', async () => {
  const title = 'concert';
  const price = 20;
  const userId = new mongoose.Types.ObjectId().toHexString();
  
  // Option 1: build the Ticket manually
  const ticketSent = Ticket.build({ 
    title: title,
    price: price,
    userId: userId
  });
  await ticketSent.save();

  const ticketReceived = await request(app)
    .get(`/api/tickets/${ticketSent._id}`)
    .send()
    .expect (200);

  expect(ticketReceived.body.userId).toEqual(userId);
  expect(ticketReceived.body.title).toEqual(title);
  expect(ticketReceived.body.price).toEqual(price);

  // Option 2: do the actual call to create the ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title, price
    })
    .expect(201);
  
  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect (200);

  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);

});