const SUPABASE_URL = 'https://mibyulmnhcdwgaoburrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYnl1bG1uaGNkd2dhb2J1cnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDg0ODQsImV4cCI6MjA3NTQ4NDQ4NH0.QQNvSfJZs113Bb7zMkZ6N30ZdzrjNmVz8s9rm5AC8Y8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

window.supabaseClient = supabaseClient;
