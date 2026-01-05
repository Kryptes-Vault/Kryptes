# Supabase dashboard checklist

- [ ] Project URL and anon / service_role keys copied to env (never commit keys).
- [ ] Authentication → URL Configuration: Site URL and `/auth/callback` redirect URLs.
- [ ] Providers enabled: Google, Azure, Twitter (client IDs from each vendor console).
- [ ] Optional: run `supabase/migrations/001_profiles.sql` in SQL editor if using `profiles`.
