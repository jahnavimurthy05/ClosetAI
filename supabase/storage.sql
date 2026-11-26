INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe-images', 'wardrobe-images', false);
CREATE POLICY "Users upload own images" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own images" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own images" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
