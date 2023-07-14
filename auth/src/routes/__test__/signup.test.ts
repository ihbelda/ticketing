import request from 'supertest';
import { app } from '../../app';

it('returns a 201 on a successful signup', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
        password: 'password'
    })
    .expect(201);
});

it('returns a 400 when an invalid email', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
        email: 'test.com',
        password: 'password'
    })
    .expect(400);
});

it('returns a 400 when an invalid password', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
        password: 'p'
    })
    .expect(400);
});

it('returns a 400 when missing email and password', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
    })
    .expect(400);

  await request(app)
    .post('/api/users/signup')
    .send({
        password: 'password'
    })
    .expect(400);
});

it('disallows duplicated emails', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
        password: 'password'
    })
    .expect(201);

  await request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
        password: 'password'
    })
    .expect(400);
});

it('set a cookie after a correct signup', async () => {
 const response = await request(app)
    .post('/api/users/signup')
    .send({
        email: 'test@test.com',
        password: 'password'
    })
    .expect(201);

  expect(response.get('Set-Cookie')).toBeDefined();

  }); 