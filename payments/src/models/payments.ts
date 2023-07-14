import mongoose from 'mongoose';

// Attrs passed to create the Entity
interface PaymentAttrs {
  orderId: string;
  stripeId: string;
}

// Actual fields stored in the DB - no version needed
interface PaymentDoc extends mongoose.Document {
  orderId: string;
  stripeId: string;
}

// The model at the code level
interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    stripeId: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment', paymentSchema);

export { Payment };
