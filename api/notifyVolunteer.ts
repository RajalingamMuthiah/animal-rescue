/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
const twilio = require('twilio');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const twilioSmsFrom = process.env.TWILIO_SMS_FROM;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server credentials');
}

if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappFrom || !twilioSmsFrom) {
  throw new Error('Missing Twilio credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Earth radius in KM
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizePhone = (phone: string) => {
  if (!phone) return '';
  return phone.startsWith('+') ? phone : `+${phone}`;
};

const buildMessage = (latitude: number, longitude: number, reporterPhone: string) => (
  `🚨 Animal Rescue Alert!\n` +
  `📍 Location: https://maps.google.com/?q=${latitude},${longitude}\n` +
  `📞 Reporter Phone: ${reporterPhone}\n` +
  `🐾 Please respond immediately.`
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { latitude, longitude, reporterPhone } = body || {};

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !reporterPhone
    ) {
      return res.status(400).json({ error: 'Missing or invalid request data' });
    }

    const { data: volunteers, error: volunteerError } = await supabase
      .from('volunteers')
      .select('id, full_name, phone, whatsapp, latitude, longitude, is_active, role')
      .eq('role', 'volunteer');

    if (volunteerError) {
      throw volunteerError;
    }

    const activeVolunteers = (volunteers || []).filter((v) => {
      const hasCoordinates =
        typeof v.latitude === 'number' && typeof v.longitude === 'number';
      return v.is_active !== false && hasCoordinates;
    });

    if (activeVolunteers.length === 0) {
      return res.status(404).json({ error: 'No active volunteers available' });
    }

    const nearest = activeVolunteers
      .map((v) => ({
        volunteer: v,
        distanceKm: haversineDistanceKm(
          latitude,
          longitude,
          v.latitude,
          v.longitude
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];

    const volunteerPhone = normalizePhone(
      nearest.volunteer.whatsapp || nearest.volunteer.phone || ''
    );

    if (!volunteerPhone) {
      return res.status(400).json({ error: 'Volunteer has no valid phone number' });
    }

    const reporterPhoneNormalized = normalizePhone(reporterPhone);
    const messageBody = buildMessage(
      latitude,
      longitude,
      reporterPhoneNormalized
    );

    await twilioClient.messages.create({
      from: twilioWhatsappFrom,
      to: `whatsapp:${volunteerPhone}`,
      body: messageBody,
    });

    await twilioClient.messages.create({
      from: twilioSmsFrom,
      to: volunteerPhone,
      body: messageBody,
    });

    return res.status(200).json({
      notified: true,
      volunteerId: nearest.volunteer.id,
      distanceKm: nearest.distanceKm,
    });
  } catch (error: any) {
    console.error('notifyVolunteer error:', error);
    return res.status(500).json({ error: 'Failed to notify volunteer' });
  }
}
