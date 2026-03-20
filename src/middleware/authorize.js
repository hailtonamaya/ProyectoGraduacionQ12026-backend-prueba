const { forbidden } = require('../utils/responseHelper')

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return forbidden(res)
    }
    next()
  }
}

module.exports = { authorize }
