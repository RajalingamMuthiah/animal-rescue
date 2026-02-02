-- =====================================================
-- NGO Animal Rescue System - Complete Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VOLUNTEERS TABLE (Extended)
-- =====================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  rescue_area TEXT,
  experience TEXT,
  role TEXT DEFAULT 'volunteer',
  
  -- Location fields for auto-assignment
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  max_concurrent_rescues INTEGER DEFAULT 3,
  
  -- Stats
  total_rescues_completed INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RESCUE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rescue_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Location data
  image_url TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_text TEXT,
  address TEXT,
  
  -- Reporter info
  reporter_phone TEXT NOT NULL,
  reporter_name TEXT,
  description TEXT,
  
  -- Assignment
  assigned_volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'in_progress', 'resolved', 'cancelled')),
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolution_image_url TEXT,
  
  -- Metadata
  submitted_by TEXT, -- Email if logged in
  submitter_name TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RESCUE HISTORY (Audit log for status changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS rescue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rescue_request_id UUID REFERENCES rescue_requests(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT, -- Email or volunteer ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DONATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Donor info
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT, -- 'razorpay', 'stripe', 'upi', 'bank_transfer'
  
  -- Gateway data
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  
  -- Metadata
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- IMAGES TABLE (Existing - Updated for completeness)
-- =====================================================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  approved_by_admin BOOLEAN DEFAULT false,
  deleted_for_user BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE (WhatsApp/SMS log)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rescue_request_id UUID REFERENCES rescue_requests(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  recipient_phone TEXT,
  
  -- Notification details
  type TEXT CHECK (type IN ('whatsapp', 'sms', 'email')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  
  -- External IDs
  twilio_sid TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rescue_requests_status ON rescue_requests(status);
CREATE INDEX IF NOT EXISTS idx_rescue_requests_assigned_volunteer ON rescue_requests(assigned_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_rescue_requests_created_at ON rescue_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_active ON volunteers(is_active);
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers(latitude, longitude) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Volunteers: Authenticated users can read all, update their own
CREATE POLICY "Volunteers readable by authenticated users"
  ON volunteers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Volunteers can update their own profile"
  ON volunteers FOR UPDATE
  USING (auth.uid() = id);

-- Rescue Requests: Public insert, volunteers read assigned, admins read all
CREATE POLICY "Anyone can create rescue requests"
  ON rescue_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Volunteers can read their assigned rescues"
  ON rescue_requests FOR SELECT
  USING (
    auth.uid() = assigned_volunteer_id 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Volunteers can update their assigned rescues"
  ON rescue_requests FOR UPDATE
  USING (auth.uid() = assigned_volunteer_id);

-- Donations: Public insert, admins read all
CREATE POLICY "Anyone can create donations"
  ON donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all donations"
  ON donations FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Images: Uploader and admins can manage
CREATE POLICY "Users can manage their own images"
  ON images FOR ALL
  USING (auth.uid() = uploader_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public can view approved images"
  ON images FOR SELECT
  USING (visibility = 'public' AND approved_by_admin = true);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run these commands in Supabase Dashboard > Storage:
-- 1. Create bucket: 'rescue-requests' (public)
-- 2. Create bucket: 'gallery' (public)
-- 3. Create bucket: 'resolution-images' (public)

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rescue_requests_updated_at BEFORE UPDATE ON rescue_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log rescue status changes
CREATE OR REPLACE FUNCTION log_rescue_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO rescue_history (rescue_request_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.assigned_volunteer_id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_rescue_status_change_trigger AFTER UPDATE ON rescue_requests
  FOR EACH ROW EXECUTE FUNCTION log_rescue_status_change();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert test volunteers with locations (Mumbai area)
-- INSERT INTO volunteers (full_name, email, phone, whatsapp, city, latitude, longitude, is_active) VALUES
-- ('Rajesh Kumar', 'rajesh@example.com', '+919876543210', '+919876543210', 'Mumbai', 19.0760, 72.8777, true),
-- ('Priya Sharma', 'priya@example.com', '+919876543211', '+919876543211', 'Mumbai', 19.1136, 72.8697, true),
-- ('Amit Patel', 'amit@example.com', '+919876543212', '+919876543212', 'Mumbai', 19.0896, 72.8656, true);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Volunteer performance view
CREATE OR REPLACE VIEW volunteer_performance AS
SELECT 
  v.id,
  v.full_name,
  v.email,
  v.city,
  COUNT(rr.id) as total_assigned,
  COUNT(CASE WHEN rr.status = 'resolved' THEN 1 END) as total_resolved,
  AVG(EXTRACT(EPOCH FROM (rr.resolved_at - rr.assigned_at))/60)::INTEGER as avg_resolution_minutes,
  v.is_active
FROM volunteers v
LEFT JOIN rescue_requests rr ON rr.assigned_volunteer_id = v.id
GROUP BY v.id, v.full_name, v.email, v.city, v.is_active;

-- Rescue statistics view
CREATE OR REPLACE VIEW rescue_statistics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'assigned') as assigned_count,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::DECIMAL(10,2) as avg_resolution_hours
FROM rescue_requests;

-- Donation statistics view
CREATE OR REPLACE VIEW donation_statistics AS
SELECT 
  COUNT(*) as total_donations,
  SUM(amount) FILTER (WHERE status = 'success') as total_amount,
  AVG(amount) FILTER (WHERE status = 'success') as average_donation,
  COUNT(*) FILTER (WHERE status = 'success') as successful_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM donations;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE rescue_requests IS 'Animal rescue requests from public and volunteers';
COMMENT ON TABLE volunteers IS 'Registered volunteers with location and availability';
COMMENT ON TABLE donations IS 'Donation transactions via Razorpay/Stripe';
COMMENT ON TABLE rescue_history IS 'Audit log for rescue status changes';
COMMENT ON TABLE notifications IS 'WhatsApp/SMS notification log';
