# Admin Authentication Setup

## Overview
This document describes the admin authentication system implemented for the Beauty Store application. The system ensures that only users with the "admin" role can access sensitive administrative endpoints.

## Architecture

### Components

#### 1. Admin Middleware (`Backend/Middleware/adminAuth.middleware.js`)
- **Purpose**: Validates that authenticated users have admin role
- **Usage**: Applied after the `protect` middleware
- **Response**: Returns 403 Forbidden if user is not admin

```javascript
// Must be used AFTER the protect middleware
router.post("/", protect, adminAuth, controllerFunction);
```

#### 2. Protected Routes
The following routes now require admin authentication:

**Product Management:**
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

**Banner Management:**
- `POST /api/v1/banners` - Create banner
- `GET /api/v1/banners` - Get all banners (admin view)
- `DELETE /api/v1/banners/:id` - Delete banner

**Bundle Management:**
- `POST /api/v1/bundles` - Create bundle
- `PUT /api/v1/bundles/:id` - Update bundle
- `DELETE /api/v1/bundles/:id` - Delete bundle

**Order Management:**
- `GET /api/v1/orders` - Get all orders
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Delete order

**Payment Management:**
- `GET /api/v1/payments` - Get all payments
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment
- `GET /api/v1/payments/status/:status` - Get payments by status

**Analytics:**
- `GET /api/v1/analytics` - Get all analytics
- `GET /api/v1/analytics/summary` - Get analytics summary
- `GET /api/v1/analytics/user/:userId` - Get user activity

**Clinic Management:**
- `GET /api/v1/clinic` - Get all clinic assessments
- `GET /api/v1/clinic/:id` - Get clinic assessment by ID
- `PUT /api/v1/clinic/:id` - Update assessment status
- `DELETE /api/v1/clinic/:id` - Delete assessment

**User Management:**
- `GET /api/v1/users` - Get all users
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

**Timetable:**
- `GET /api/v1/timetable` - Get all timetable requests (admin)

## Creating an Admin User

### Method 1: Using Seed Script (Recommended)

1. Navigate to Backend directory:
```bash
cd Backend
```

2. Run the admin seed script:
```bash
node scripts/seedAdmin.js
```

This will create an admin user with the following credentials:
- **Email**: admin@beautystore.com
- **Password**: Admin@123456
- **Role**: admin

**Important**: Change the default password after first login!

### Method 2: Manual Creation

1. Connect to MongoDB
2. Create a user document with:
```json
{
  "name": "Admin Name",
  "email": "admin@yourdomain.com",
  "password": "hashed_password",
  "role": "admin",
  "status": 0
}
```

Note: Passwords are automatically hashed using bcryptjs before storage.

## Authentication Flow

1. **User Login**: Admin logs in via `/api/v1/auth/login`
2. **Token Generation**: JWT token is generated and stored in httpOnly cookie
3. **Request Protection**: 
   - `protect` middleware validates JWT token
   - `adminAuth` middleware checks user role
4. **Access Grant/Deny**: 
   - If admin: route handler executes
   - If not admin: 403 Forbidden error returned

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```
User not logged in or token expired.

### 403 Forbidden
```json
{
  "message": "Access denied. Administrator privileges required."
}
```
User is logged in but doesn't have admin role.

## User Model

The User model includes a `role` field:
- **Default Value**: "user"
- **Admin Value**: "admin"

```javascript
role: {
  type: String,
  default: "user",
}
```

## Environment Setup

Ensure these environment variables are configured in `.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_SEC=your_jwt_secret_key (fallback)
CLIENT_URL=http://localhost:5173
```

## Testing Admin Authentication

### Using Postman or curl:

1. **Login as Admin**:
```bash
POST /api/v1/auth/login
Body: {
  "email": "admin@beautystore.com",
  "password": "Admin@123456"
}
```

2. **Try Admin Route**:
```bash
GET /api/v1/products
```
Response will include jwt cookie or return 401/403 if not admin.

3. **Test Non-Admin Access**:
Create a user with role "user" and attempt admin routes - should get 403 Forbidden.

## Security Best Practices

1. ✅ Always use `protect` middleware before `adminAuth`
2. ✅ Change default admin password after first login
3. ✅ Use strong passwords (minimum 12 characters)
4. ✅ Enable HTTPS in production
5. ✅ Regularly rotate JWT secret
6. ✅ Monitor admin activity logs
7. ✅ Use role-based access control (RBAC) for fine-grained permissions

## Frontend Integration

The Admin panel already includes:
- Login validation checking for admin role
- Automatic redirect for non-admin users
- Local storage of user data with role verification
- Error handling for unauthorized access

```javascript
// Admin Login checks role after API call
if (userData.role !== 'admin') {
  setError("Access denied. Administrator privileges required.");
  return;
}
```

## Troubleshooting

### Issue: Getting 403 when accessing admin routes
**Solution**: Ensure user has role "admin" in the database

### Issue: Getting 401 unauthorized error
**Solution**: 
1. Check if JWT token is valid
2. Verify JWT_SECRET environment variable is set
3. Clear cookies and re-login

### Issue: Admin routes not working after code changes
**Solution**: 
1. Restart the server
2. Clear browser cache
3. Verify middleware imports are correct

## Future Enhancements

1. Add permission levels (read, write, delete)
2. Implement audit logging for admin actions
3. Add 2FA (Two-Factor Authentication) for admin accounts
4. Create admin activity dashboard
5. Implement password reset functionality
6. Add role-based route access control

---

**Last Updated**: May 28, 2026
**Version**: 1.0
