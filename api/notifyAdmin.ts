/// <reference types="node" />
const twilio = require('twilio');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const adminWhatsappNumber = process.env.ADMIN_WHATSAPP_NUMBER; // e.g., '+919876543210'

if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappFrom || !adminWhatsappNumber) {
  throw new Error('Missing Twilio or admin credentials');
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

interface NotifyAdminRequest {
  rescueRequestId: string;
  latitude: number;
  longitude: number;
  reporterPhone: string;
  status: string;
  volunteerName?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { 
      rescueRequestId, 
      latitude, 
      longitude, 
      reporterPhone, 
      status,
      volunteerName 
    }: NotifyAdminRequest = body || {};

    if (!rescueRequestId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    let message = `🔔 *Admin Alert - Rescue Request ${rescueRequestId.slice(0, 8)}*\n\n`;
    
    if (status === 'pending') {
      message += `📋 Status: New rescue request\n`;
    } else if (status === 'assigned') {
      message += `✅ Status: Assigned to ${volunteerName || 'Volunteer'}\n`;
    } else if (status === 'accepted') {
      message += `🚀 Status: Accepted by ${volunteerName || 'Volunteer'}\n`;
    } else if (status === 'resolved') {
      message += `✅ Status: Resolved by ${volunteerName || 'Volunteer'}\n`;
    }
    
    message += `📍 Location: ${mapsLink}\n`;
    message += `📞 Reporter: ${reporterPhone}\n`;
    message += `🕐 Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    // Send WhatsApp to admin
    await twilioClient.messages.create({
      from: twilioWhatsappFrom,
      to: `whatsapp:${adminWhatsappNumber}`,
      body: message,
    });

    return res.status(200).json({ notified: true });
  } catch (error: any) {
    console.error('notifyAdmin error:', error);
    return res.status(500).json({ 
      error: 'Failed to notify admin',
      details: error.message 
    });
  }
}
