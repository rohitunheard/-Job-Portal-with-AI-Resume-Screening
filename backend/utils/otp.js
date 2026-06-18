const crypto = require('crypto')

const createOtpCode = () => String(crypto.randomInt(100000, 1000000))

const hashOtpCode = (code) => crypto.createHash('sha256').update(code).digest('hex')

module.exports = {
  createOtpCode,
  hashOtpCode,
}