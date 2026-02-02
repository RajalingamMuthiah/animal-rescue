/// <reference types="node" />
const twilio = require('twilio');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const whatsappGroupId = process.env.WHATSAPP_GROUP_ID; // e.g., '120363XXXXXXXXX@g.us'

if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappFrom) {
  throw new Error('Missing Twilio credentials');
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

interface PostToGroupRequest {
  message: string;
  imageUrl?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, imageUrl }: PostToGroupRequest = body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!whatsappGroupId) {
      // Fallback: send to individual admin if group not configured
      return res.status(200).json({ 
        notified: false,
        message: 'WhatsApp group not configured' 
      });
    }

    const messagePayload: any = {
      from: twilioWhatsappFrom,
      to: `whatsapp:${whatsappGroupId}`,
      body: message,
    };

    if (imageUrl) {
      messagePayload.mediaUrl = [imageUrl];
    }

    await twilioClient.messages.create(messagePayload);

    return res.status(200).json({ notified: true });
  } catch (error: any) {
    console.error('postToGroup error:', error);
    return res.status(500).json({ 
      error: 'Failed to post to group',
      details: error.message 
    });
  }
}
