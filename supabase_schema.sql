-- ============================================
-- MQUS Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'barber')),
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. BARBERS_META TABLE
-- ============================================
CREATE TABLE barbers_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating FLOAT DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. SERVICES TABLE
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers_meta(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 4. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers_meta(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers_meta(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. WALLET_EARNINGS TABLE
-- ============================================
CREATE TABLE wallet_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers_meta(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  month_year TEXT NOT NULL,
  reset_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_earnings ENABLE ROW LEVEL SECURITY;
-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: BARBERS_META
-- ============================================
CREATE POLICY "Anyone can view active barbers" ON barbers_meta
  FOR SELECT USING (is_active = true);

CREATE POLICY "Barbers can view own meta" ON barbers_meta
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Barbers can update own meta" ON barbers_meta
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: SERVICES
-- ============================================
CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (
    barber_id IN (SELECT id FROM barbers_meta WHERE is_active = true)
  );

CREATE POLICY "Barbers can insert own services" ON services
  FOR INSERT WITH CHECK (
    barber_id IN (SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Barbers can update own services" ON services
  FOR UPDATE USING (
    barber_id IN (SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Barbers can delete own services" ON services
  FOR DELETE USING (
    barber_id IN (SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

-- ============================================
-- RLS POLICIES: APPOINTMENTS
-- ============================================
CREATE POLICY "Customers can view own appointments" ON appointments
  FOR SELECT USING (
    customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR barber_id IN (
      SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Customers can insert appointments" ON appointments
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can update own appointments" ON appointments
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: REVIEWS
-- ============================================
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (
    customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR barber_id IN (
      SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Customers can insert reviews" ON reviews
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: WALLET_EARNINGS
-- ============================================
CREATE POLICY "Barbers can view own earnings" ON wallet_earnings
  FOR SELECT USING (
    barber_id IN (SELECT id FROM barbers_meta WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "System can insert earnings" ON wallet_earnings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM barbers_meta bm
      JOIN profiles p ON p.id = bm.profile_id
      WHERE bm.id = barber_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_barbers_meta_profile_id ON barbers_meta(profile_id);
CREATE INDEX idx_barbers_meta_is_active ON barbers_meta(is_active);
CREATE INDEX idx_services_barber_id ON services(barber_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_reviews_appointment_id ON reviews(appointment_id);
CREATE INDEX idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX idx_wallet_earnings_barber_id ON wallet_earnings(barber_id);
CREATE INDEX idx_wallet_earnings_month_year ON wallet_earnings(month_year);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_barbers_meta_updated_at
  BEFORE UPDATE ON barbers_meta
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wallet_earnings_updated_at
  BEFORE UPDATE ON wallet_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- END OF SCHEMA
-- ============================================

