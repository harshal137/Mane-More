# Admin Panel Login Authentication

## Overview
The admin panel now has a complete login authentication system that:
- Protects all admin routes requiring login
- Validates admin role on backend and frontend
- Manages authentication state globally using React Context
- Provides automatic redirect to login for unauthenticated users
- Maintains session persistence via localStorage

## Architecture

### Components

#### 1. **AuthContext** (`src/context/AuthContext.jsx`)
Global authentication state management using React Context API

```javascript
// Available in any component:
const { user, isAuthenticated, login, logout, updateUser } = useAuth();
```

**Features:**
- `user` - Current logged-in admin user data
- `isAuthenticated` - Boolean flag for login status
- `isLoading` - Loading state during initial auth check
- `login(userData)` - Login function with role validation
- `logout()` - Clear auth state and localStorage
- `updateUser(userData)` - Update user data

#### 2. **useAuth Hook** (`src/hooks/useAuth.js`)
Custom hook to access authentication context

```javascript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  // Use auth state in component
};
```

#### 3. **ProtectedRoute** (`src/components/ProtectedRoute.jsx`)
Wrapper component that protects routes requiring authentication

```javascript
<ProtectedRoute>
  <Layout /> {/* Only renders if user is authenticated */}
</ProtectedRoute>
```

**Behavior:**
- Shows loading spinner while checking authentication
- Redirects unauthenticated users to `/login`
- Allows authenticated admin users to proceed

#### 4. **Login Page** (`src/pages/Login.jsx`)
Enhanced login form with:
- Email and password input fields
- Password visibility toggle
- Form validation
- Error handling with detailed messages
- Admin role verification
- Smooth transition animations
- "Remember me" checkbox
- Forgot password link (UI ready)

#### 5. **Updated Routing** (`src/App.jsx`)
- `/login` - Public login route
- `/` - Protected admin dashboard routes
- All admin routes wrapped with `ProtectedRoute` component

#### 6. **Menu Component** (`src/components/Menu.jsx`)
- Updated to use `useAuth` hook
- Logout button uses context `logout()` function

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Access                          │
└────────────────────┬────────────────────────────────────┘
                     │
              Check AuthContext
                     │
         ┌───────────┴───────────┐
         │                       │
    Authenticated        Not Authenticated
         │                       │
    Can Access          Redirect to /login
    Dashboard                    │
         │                    ┌──┴──┐
         │                    │ Login │
         │              Enter Credentials
         │                    │
         │              Call loginAPI
         │                    │
         │              ┌─────┴─────┐
         │              │           │
         │          Admin Role  Non-Admin
         │              │           │
         │          Store in    Deny Access
         │         AuthContext     │
         │              │      Show Error
         │         Navigate to
         │         Dashboard
         │
```

## Setup Instructions

### 1. File Structure
Make sure these files/directories exist:

```
Admin/src/
├── context/
│   └── AuthContext.jsx        (NEW)
├── hooks/
│   └── useAuth.js             (NEW)
├── components/
│   ├── ProtectedRoute.jsx      (NEW)
│   └── Menu.jsx               (UPDATED)
├── pages/
│   └── Login.jsx              (UPDATED)
├── App.jsx                    (UPDATED)
├── main.jsx
├── index.css
└── ...
```

### 2. Install Dependencies
All required dependencies should already be installed:
- `react` - UI library
- `react-router-dom` - Routing
- `react-icons` - Icons

If not, run:
```bash
cd Admin
npm install react-router-dom react-icons
```

### 3. Setup Backend Admin User
Before testing, create an admin user on the backend:

```bash
cd Backend
npm run seed-admin
```

**Default Admin Credentials:**
- Email: `admin@beautystore.com`
- Password: `Admin@123456`

**⚠️ Change the password after first login!**

### 4. Environment Configuration
Ensure `Admin/.env` has correct API URL:

```env
VITE_API_URL=http://localhost:4001/api/v1
```

## Features

### Login Features
✅ Email/Password validation
✅ Admin role checking
✅ Password visibility toggle
✅ Error messages with proper HTTP status handling
✅ Loading states and animations
✅ Smooth page transitions
✅ "Remember me" functionality (UI ready)
✅ Forgot password link (UI ready)

### Security Features
✅ Protected routes require authentication
✅ JWT tokens stored in httpOnly cookies
✅ Admin role validated on backend
✅ Session persistence with localStorage
✅ Automatic redirect for non-admin users
✅ Logout clears all sensitive data

### User Experience
✅ Loading spinner during authentication check
✅ Automatic redirect from login if already authenticated
✅ Automatic redirect to login if not authenticated
✅ Error notifications with auto-dismiss
✅ Smooth transitions between pages
✅ Logout button in sidebar

## Usage Examples

### Accessing Auth Context

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Checking Admin Status

```javascript
import { useAuth } from '../hooks/useAuth';

function AdminOnly() {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'admin' && (
        <p>You have admin privileges</p>
      )}
    </div>
  );
}
```

### Logout Function

```javascript
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## Testing Login

### Test Scenario 1: Successful Admin Login
1. Start Backend: `npm run dev`
2. Start Admin Panel: `npm run dev`
3. Navigate to http://localhost:5174/login
4. Enter:
   - Email: `admin@beautystore.com`
   - Password: `Admin@123456`
5. Click "Access Admin Dashboard"
6. Should redirect to dashboard

### Test Scenario 2: Non-Admin User Rejection
1. Create a regular user in database with role: "user"
2. Try login with that user
3. Should show error: "Access denied. Administrator privileges required."

### Test Scenario 3: Protected Route Access
1. Logout from admin panel
2. Try accessing http://localhost:5174/home directly
3. Should redirect to `/login`

### Test Scenario 4: Session Persistence
1. Login as admin
2. Refresh the page
3. Should remain logged in
4. Close browser and reopen
5. Should still be logged in (localStorage persists)

### Test Scenario 5: Logout
1. Click logout button in sidebar
2. Should redirect to `/login`
3. Attempting to access `/home` should redirect to `/login`

## Error Handling

The system handles various error scenarios:

| Error | Response |
|-------|----------|
| Invalid credentials | "Invalid email or password" |
| Non-admin user | "Access denied. Administrator privileges required." |
| User not found | "User not found" |
| Network error | "Network error. Please check your connection." |
| Server error | "Server error. Please try again later." |
| Missing token | Automatic redirect to login |
| Expired token | Automatic redirect to login |

## LocalStorage Structure

```javascript
// Stored data in browser localStorage:
localStorage.user = JSON.stringify({
  _id: "user_id_here",
  name: "Admin User",
  email: "admin@beautystore.com",
  role: "admin"
});

localStorage.access_token = "jwt_token_here";
localStorage.refresh_token = "refresh_token_here";
```

## Troubleshooting

### Issue: Getting stuck on login page
**Solution:**
1. Check backend is running: `npm run dev` in Backend folder
2. Verify API URL in `.env`: `VITE_API_URL=http://localhost:4001/api/v1`
3. Check admin user exists: `npm run seed-admin`

### Issue: Login works but redirects back to login
**Solution:**
1. Verify user role is "admin" in database
2. Check browser console for errors
3. Clear localStorage: `localStorage.clear()` in console

### Issue: "useAuth must be used within AuthProvider" error
**Solution:**
1. Ensure AuthProvider wraps the component tree in App.jsx
2. Only use useAuth inside components rendered by App

### Issue: Can't logout
**Solution:**
1. Check logout button is calling logout function
2. Verify Menu component imports useAuth
3. Try clearing localStorage manually: `localStorage.clear()`

## Best Practices

1. **Always use ProtectedRoute** for admin-only pages
2. **Use useAuth hook** instead of directly accessing localStorage
3. **Check isLoading** before rendering components
4. **Validate admin role** both frontend and backend
5. **Use logout** function instead of manual cleanup
6. **Never store sensitive data** in localStorage
7. **Handle errors gracefully** with user-friendly messages

## Future Enhancements

1. ✨ Implement "Remember me" functionality
2. ✨ Add password recovery flow
3. ✨ Implement token refresh mechanism
4. ✨ Add 2FA (Two-Factor Authentication)
5. ✨ Create admin activity logs
6. ✨ Add session timeout warning
7. ✨ Implement role-based access control (RBAC)
8. ✨ Add account settings page

## File References

- **Context**: [Admin/src/context/AuthContext.jsx](../Admin/src/context/AuthContext.jsx)
- **Hook**: [Admin/src/hooks/useAuth.js](../Admin/src/hooks/useAuth.js)
- **Protected Route**: [Admin/src/components/ProtectedRoute.jsx](../Admin/src/components/ProtectedRoute.jsx)
- **Login Page**: [Admin/src/pages/Login.jsx](../Admin/src/pages/Login.jsx)
- **App Routing**: [Admin/src/App.jsx](../Admin/src/App.jsx)
- **Menu**: [Admin/src/components/Menu.jsx](../Admin/src/components/Menu.jsx)

---

**Last Updated**: May 28, 2026
**Version**: 1.0
