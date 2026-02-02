/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Haversine formula to calculate distance between two coordinates in kilometers
 */
const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in KM
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

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

interface AssignRescueRequest {
  rescueRequestId: string;
  latitude: number;
  longitude: number;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { rescueRequestId, latitude, longitude }: AssignRescueRequest = body || {};

    if (!rescueRequestId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1) Fetch all active volunteers with locations
    const { data: volunteers, error: volunteerError } = await supabase
      .from('volunteers')
      .select('id, full_name, phone, whatsapp, latitude, longitude, is_active')
      .eq('role', 'volunteer')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (volunteerError) {
      throw volunteerError;
    }

    if (!volunteers || volunteers.length === 0) {
      return res.status(404).json({ 
        error: 'No active volunteers available',
        assigned: false 
      });
    }

    // 2) Calculate distances and find nearest volunteer
    const volunteersWithDistance = volunteers.map((v) => ({
      volunteer: v,
      distanceKm: haversineDistanceKm(
        latitude,
        longitude,
        v.latitude,
        v.longitude
      ),
    }));

    const sorted = volunteersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    const nearest = sorted[0];

    // 3) Assign rescue to nearest volunteer
    const { error: updateError } = await supabase
      .from('rescue_requests')
      .update({
        assigned_volunteer_id: nearest.volunteer.id,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
      })
      .eq('id', rescueRequestId);

    if (updateError) {
      throw updateError;
    }

    // 4) Return success
    return res.status(200).json({
      assigned: true,
      volunteerId: nearest.volunteer.id,
      volunteerName: nearest.volunteer.full_name,
      distanceKm: Math.round(nearest.distanceKm * 10) / 10,
    });
  } catch (error: any) {
    console.error('assignRescue error:', error);
    return res.status(500).json({ 
      error: 'Failed to assign rescue',
      details: error.message 
    });
  }
}
