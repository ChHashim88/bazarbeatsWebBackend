import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderConfirmationEmail = async (userEmail, userName, order) => {
  try {
    const mailOptions = {
      from: `"Aaagain Futuristic Footwear" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation - ${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; background-color: #0a0a0a; color: #ffffff; max-w: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #333;">
          <h2 style="color: #22d3ee; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px;">Thank you for your order!</h2>
          <p style="font-size: 16px;">Hi ${userName},</p>
          <p style="color: #aaaaaa; line-height: 1.5;">Your order has been successfully placed. We are processing it and will ship it soon. Below are the details of your purchase.</p>
          
          <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #22d3ee; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tbody>
                ${order.orderItems?.map(item => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #333; width: 60px;">
                      <div style="width: 50px; height: 50px; background-color: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img src="http://localhost:5000${item.product?.images?.[0] || ''}" alt="${item.product?.name || 'Product'}" style="width: 100%; height: 100%; object-fit: contain;" />
                      </div>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #333;">
                      <p style="margin: 0; font-weight: bold; color: #fff; font-size: 14px;">${item.product?.name || 'Product'}</p>
                      <p style="margin: 4px 0 0; font-size: 11px; color: #888;">Qty: ${item.quantity} &nbsp;|&nbsp; Size: ${item.size || 'N/A'} &nbsp;|&nbsp; Color: ${item.color || 'N/A'}</p>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #333; text-align: right; font-family: monospace; color: #22d3ee; font-weight: bold;">
                      Rs ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <p style="margin: 0 0 10px 0;"><strong style="color: #22d3ee;">Order ID:</strong> <span style="font-family: monospace;">${order.id}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #22d3ee;">Payment Method:</strong> ${order.paymentMethod || 'COD'}</p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #22d3ee;">Total Amount:</strong> <span style="font-size: 1.1em;">Rs ${order.total.toFixed(2)}</span></p>
            
            <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
              <strong style="color: #22d3ee; display: block; margin-bottom: 10px;">Delivery Address:</strong>
              <p style="margin: 0; color: #aaaaaa; line-height: 1.6; font-size: 14px;">
                ${order.shippingAddress.fullName || userName}<br/>
                ${order.shippingAddress.address}<br/>
                ${order.shippingAddress.city}, ${order.shippingAddress.postalCode || ''}<br/>
                ${order.shippingAddress.phone || ''}
              </p>
            </div>
          </div>
          
          <p style="margin-top: 30px; color: #aaaaaa;">Step into the future,</p>
          <p><strong style="color: #22d3ee;">The Aaagain Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
