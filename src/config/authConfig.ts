export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "your-client-id-here",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "your-tenant-id"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "https://graph.microsoft.com/Application.ReadWrite.All",
    "https://graph.microsoft.com/Directory.ReadWrite.All",
    "https://graph.microsoft.com/User.Read.All",
    "https://graph.microsoft.com/AppRoleAssignment.ReadWrite.All",
    "https://graph.microsoft.com/DelegatedPermissionGrant.ReadWrite.All"
  ],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphApplicationsEndpoint: "https://graph.microsoft.com/v1.0/applications",
  graphServicePrincipalsEndpoint: "https://graph.microsoft.com/v1.0/servicePrincipals",
  graphUsersEndpoint: "https://graph.microsoft.com/v1.0/users",
};