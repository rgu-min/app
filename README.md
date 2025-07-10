# Entra ID Permissions Manager

Una aplicación web moderna para gestionar permisos de aplicaciones y service principals en Azure AD/Entra ID.

## Configuración de Azure AD

### 1. Registrar la aplicación en Azure AD

1. Ve al [Azure Portal](https://portal.azure.com)
2. Navega a **Azure Active Directory** > **App registrations**
3. Haz clic en **New registration**
4. Configura:
   - **Name**: Entra ID Permissions Manager
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Single-page application (SPA) - `http://localhost:5173`

### 2. Configurar permisos de API

En tu aplicación registrada, ve a **API permissions** y agrega:

**Microsoft Graph**:
- `Application.ReadWrite.All` (Application)
- `Directory.ReadWrite.All` (Application) 
- `User.Read.All` (Application)
- `AppRoleAssignment.ReadWrite.All` (Application)
- `DelegatedPermissionGrant.ReadWrite.All` (Application)

**Importante**: Estos permisos requieren consentimiento de administrador.

### 3. Configurar autenticación

En **Authentication**:
- Asegúrate de que la URI de redirección esté configurada como SPA
- Habilita **Access tokens** y **ID tokens**
- Configura **Logout URL**: `http://localhost:5173`

**IMPORTANTE para WebContainer/Bolt.new**: Si estás ejecutando la aplicación en un entorno WebContainer (como Bolt.new), necesitas agregar la URL específica del entorno a las URIs de redirección:

1. Ve a **Authentication** en tu aplicación de Azure AD
2. En **Platform configurations**, selecciona **Single-page application**
3. Agrega estas URIs de redirección:
   - `http://localhost:5173` (para desarrollo local)
   - La URL completa del WebContainer que aparece en el error (ej: `https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--96435430.local-credentialless.webcontainer-api.io`)
4. Guarda los cambios

**Nota**: La URL del WebContainer cambia cada vez que se reinicia el entorno, por lo que es posible que necesites actualizarla periódicamente.

### 4. Variables de entorno

1. Copia `.env.example` a `.env`
2. Completa con tus valores:

```env
VITE_AZURE_CLIENT_ID=tu-client-id-aqui
VITE_AZURE_TENANT_ID=tu-tenant-id-aqui
```

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Funcionalidades

- ✅ Autenticación con Azure AD
- ✅ Gestión de aplicaciones
- ✅ Gestión de service principals
- ✅ Administración de permisos de aplicación y delegados
- ✅ Asignación de permisos por usuario
- ✅ Habilitación/deshabilitación de aplicaciones
- ✅ Dashboard con estadísticas
- ✅ Búsqueda y filtrado

## Arquitectura

La aplicación utiliza:
- **React 18** con TypeScript
- **MSAL.js** para autenticación
- **Microsoft Graph SDK** para API calls
- **Tailwind CSS** para estilos
- **Lucide React** para iconos

## Seguridad

- Autenticación OAuth 2.0 con PKCE
- Tokens almacenados en sessionStorage
- Permisos granulares de Microsoft Graph
- Validación de permisos en cada operación

## Solución de problemas

### Error AADSTS9002326 - Cross-origin token redemption

Si ves este error, significa que la URL actual no está registrada como URI de redirección válida:

1. Copia la URL completa que aparece en el error
2. Ve a Azure Portal > App registrations > tu aplicación > Authentication
3. Agrega la URL como nueva URI de redirección en la plataforma "Single-page application"
4. Guarda y vuelve a intentar el login