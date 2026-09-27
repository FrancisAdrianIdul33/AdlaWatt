export const Routes = {
  // Authentication
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",

  // Dashboard
  DASHBOARD: "/dashboard/dashboard",

  // Dashboard Pages
  APPLIANCES: "/dashboard/appliances",
  COMPONENTS: "/dashboard/components",
  ACTIVITY_LOGS: "/dashboard/activity-logs",
  ANALYTICS: "/dashboard/analytics",
  
  NOTIFICATIONS: "/dashboard/notifications",
  MENU: "/dashboard/menu",
  ABOUT_US: "/dashboard/about-us",
  USER_MANUAL: "/dashboard/user-manual",
} as const;