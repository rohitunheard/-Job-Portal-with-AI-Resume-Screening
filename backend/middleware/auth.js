const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'jobportal_secret'

// Generic token verifier
const verifyToken = (req, res, next, role) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Access denied. No token provided.' })

  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET)
    if (role && decoded.role !== role)
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' })
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' })
  }
}

const authUser     = (req, res, next) => verifyToken(req, res, next, 'user')
const authEmployer = (req, res, next) => verifyToken(req, res, next, 'employer')
const authAdmin    = (req, res, next) => verifyToken(req, res, next, 'admin')
const authAny      = (req, res, next) => verifyToken(req, res, next, null)

module.exports = { authUser, authEmployer, authAdmin, authAny }
