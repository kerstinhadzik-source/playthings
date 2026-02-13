import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Kerstin at playthings <onboarding@resend.dev>',
      to: email,
      subject: 'thanks for reaching out',
      html: `
        <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #42423f;">
          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">Hi,</p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">Thanks for reaching out. I saw your email come through and wanted to respond personally.</p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">playthings is a structure for women who've built relationship-based businesses and need a stable foundation behind them. We handle fulfillment, logistics, and product continuity. You keep your customers, your voice, and your way of doing things.</p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">No MLM. No recruiting. No shifting terms.</p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px;">I'd love to learn a little about you and what you're looking for. Feel free to reply to this email or we can set up a quick call, whatever works best.</p>

          <p style="font-size: 15px; line-height: 1.8; margin-bottom: 4px;">Kerstin Hadzik</p>
          <p style="font-size: 13px; line-height: 1.6; color: #9a8b80; margin-bottom: 4px;">Founder, playthings</p>
          <p style="font-size: 13px; line-height: 1.6;"><a href="https://myplaythings.com" style="color: #9a8b80;">myplaythings.com</a></p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
