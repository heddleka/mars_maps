// vite.config.js
import { defineConfig, loadEnv } from "file:///Users/darkstar/Documents/mars_maps/node_modules/vite/dist/node/index.js";
import react from "file:///Users/darkstar/Documents/mars_maps/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///Users/darkstar/Documents/mars_maps/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const { PORT = "3001" } = loadEnv(mode, process.cwd(), "");
  const apiTarget = `http://127.0.0.1:${PORT}`;
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 3e3,
      host: true,
      proxy: {
        "/api": apiTarget,
        "/uploads": apiTarget
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZGFya3N0YXIvRG9jdW1lbnRzL21hcnNfbWFwc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2RhcmtzdGFyL0RvY3VtZW50cy9tYXJzX21hcHMvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2RhcmtzdGFyL0RvY3VtZW50cy9tYXJzX21hcHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IHsgUE9SVCA9ICczMDAxJyB9ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIGNvbnN0IGFwaVRhcmdldCA9IGBodHRwOi8vMTI3LjAuMC4xOiR7UE9SVH1gO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHRhaWx3aW5kY3NzKCksXG4gICAgXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICBob3N0OiB0cnVlLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9hcGknOiBhcGlUYXJnZXQsXG4gICAgICAgICcvdXBsb2Fkcyc6IGFwaVRhcmdldFxuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyUixTQUFTLGNBQWMsZUFBZTtBQUNqVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxFQUFFLE9BQU8sT0FBTyxJQUFJLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQ3pELFFBQU0sWUFBWSxvQkFBb0IsSUFBSTtBQUUxQyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
