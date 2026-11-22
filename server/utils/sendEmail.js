const nodemailer = require('nodemailer');

const createTransporter = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS are required to send email.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: Number.parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TrendShops <noreply@trendshops.in>',
      to,
      subject,
      html,
      text,
    });
    console.log(JSON.stringify({ level: 'info', event: 'email_sent', messageId: info.messageId }));
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'email_send_failed',
      name: error.name || 'Error',
      ...(process.env.NODE_ENV === 'development' && { message: error.message }),
    }));
    return { success: false, error: error.message };
  }
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#f97316;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;">TrendShops</h1>
        <p style="color:#fff;margin:5px 0;">Order Confirmed! 🎉</p>
      </div>
      <div style="padding:20px;">
        <p>Hi ${user.name},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Product</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;">
          <p>Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}</p>
          <p>Shipping: ₹${order.shipping.toLocaleString('en-IN')}</p>
          <p>Tax: ₹${order.tax.toLocaleString('en-IN')}</p>
          ${order.discount > 0 ? `<p style="color:green;">Discount: -₹${order.discount.toLocaleString('en-IN')}</p>` : ''}
          <h3>Total: ₹${order.total.toLocaleString('en-IN')}</h3>
        </div>
        <p>Payment Method: <strong>${order.paymentMethod}</strong></p>
        <p>Thank you for shopping with TrendShops!</p>
      </div>
    </div>`;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed - ${order.orderNumber} | TrendShops`,
    html,
  });
};

const sendShipmentEmail = async (user, order) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#f97316;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;">TrendShops</h1>
      </div>
      <div style="padding:20px;">
        <p>Hi ${user.name},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been shipped! 🚚</p>
        <p>Courier: <strong>${order.courier}</strong></p>
        <p>AWB Number: <strong>${order.awbNumber}</strong></p>
        <p>Tracking ID: <strong>${order.trackingId}</strong></p>
        ${order.otp?.code ? `<p>Delivery OTP: <strong style="font-size:24px;color:#f97316;">${order.otp.code}</strong> (Share with delivery agent)</p>` : ''}
        <p>Thank you for shopping with TrendShops!</p>
      </div>
    </div>`;

  return sendEmail({
    to: user.email,
    subject: `Order Shipped - ${order.orderNumber} | TrendShops`,
    html,
  });
};

module.exports = { sendEmail, sendOrderConfirmationEmail, sendShipmentEmail };
