import request from 'supertest';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';
import { app } from '../../app';
import { natsWrapper } from '../../nats-wrapper';

const createTicket = () => {
  return request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'things', 
      price: 20
    })
};

it('it returns a 404 if the id does not exists', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'something',
      price: 10
    })
    .expect(404);
});

it('it returns a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();  
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'something',
      price: 10
    })
    .expect(401);
});

it('it returns a 401 does not own the ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'music fest',
      price: 10
    })
  
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.signin()) // call a second time to get another id
    .send({
      title: 'something',
      price: 20
    })
    .expect(401);
  
  const ticketReceived = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect (200);  
  
  // extra check to ensure it did not change the ticket
  expect(ticketReceived.body.title).toEqual(response.body.title);
  expect(ticketReceived.body.price).toEqual(response.body.price);

});

it('it returns a 400 provides an invalid title or price', async () => {
  const cookie = global.signin();
  
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'music fest',
      price: 10
    })
  
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      price: 20
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      title: '',
      price: 20
    })
    .expect(400);
  
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      title: 'Fest',
      price: -20
    })
    .expect(400);
  
    await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      title: 'Fest'
    })
    .expect(400);


});

it('it returns a 200 if everything goes well', async () => {
  const cookie = global.signin();
  const newTitle = 'music hall';
  const newPrice = 2000
  
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'music fest',
      price: 10
    })
  
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      title: newTitle,
      price: newPrice
    })
    .expect(200);
    
  const ticketReceived = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send();
  
  expect(ticketReceived.body.title).toEqual(newTitle);
  expect(ticketReceived.body.price).toEqual(newPrice);
});

it('published an event', async () => {
  const cookie = global.signin();
  const newTitle = 'music hall';
  const newPrice = 2000
  
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'music fest',
      price: 10
    })
  
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie) 
    .send({
      title: newTitle,
      price: newPrice
    })
    .expect(200);

  
  expect(natsWrapper.client.publish).toHaveBeenCalled();

});

it('rejects an update if it is already reserved', async () => {
  const cookie = global.signin();
  const newTitle = 'music hall';
  const newPrice = 2000;

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'music fest',
      price: 10,
    });
  
    const ticket = await Ticket.findById(response.body.id);
    ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
    await ticket!.save();

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: newTitle,
      price: newPrice,
    })
    .expect(400);
});