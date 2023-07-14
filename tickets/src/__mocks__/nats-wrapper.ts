// This is the minimum amount to define to fake the use of NATS 
// Adding fn() to allow to test it
export const natsWrapper = {
  client: {
    publish:jest.fn().mockImplementation(
      (subject: string, data: string, callback: () => void) => {
        callback();
      }
    ),
  },
};