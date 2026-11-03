/**
 * Server-side Admin Authentication Middleware
 * Validates the Supabase JWT Bearer token and verifies admin privileges.
 */
export function requireAdminAuth(supabase) {
  const allowedAdmins = (process.env.SWICH_ADMIN_EMAILS || 'snakeyes358@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  return async (req, res, next) => {
    // Check Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or malformed Bearer token',
        code: 'unauthorized',
      })
    }

    const token = authHeader.split(' ')[1]

    // In unit test environment, allow mock token
    if (process.env.NODE_ENV === 'test' && token.startsWith('mock-admin-token')) {
      req.adminUser = {
        id: 'test-admin-id',
        email: 'snakeyes358@gmail.com',
        role: 'super_admin',
      }
      return next()
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid or expired access token',
          code: 'invalid_token',
        })
      }

      const userEmail = (user.email || '').toLowerCase()
      if (!allowedAdmins.includes(userEmail)) {
        return res.status(403).json({
          error: 'Forbidden: User is not authorized to access the payout module',
          code: 'forbidden',
        })
      }

      req.adminUser = user
      next()
    } catch (err) {
      return res.status(500).json({
        error: 'Internal authentication error',
        code: 'auth_error',
      })
    }
  }
}
