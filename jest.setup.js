// Supabase realtime-js requires a global WebSocket at
// createClient time. Node 20 (CI toolchain) has no stable
// global WebSocket, so polyfill from the `ws` devDependency
// before any service module constructs the client.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = require("ws");
}

// AsyncStorage ships a native module that does not exist
// under Jest. The package's own documented mock stands in
// (services under test never touch storage on import).
jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Jest loads the real Supabase client module in tests that
// import services transitively. The client throws at import
// time without credentials, so tests run against dummy values
// (pure-function tests never call the network).
process.env.EXPO_PUBLIC_SUPABASE_URL =
  "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_KEY =
  "test-anon-key";
process.env.EXPO_PUBLIC_OWM_KEY =
  "test-owm-key";
process.env.EXPO_PUBLIC_AGENTMAIL_LOGO_URL =
  "https://test.supabase.co/logo.png";
