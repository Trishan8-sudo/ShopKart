import jwt from 'jsonwebtoken'
import { CustomerModel } from '../models/customer.model.js'

// custom middleware for cookie comparison with jwt_secret and login authorization
const isAuthenticated = async (req, res, next) => {
  try {
    let token = req.cookies ? req.cookies.token : null


    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized Access. User must be logged in',
      })
    }

    const decoded = jwt.verify(token, process.env.jwt_secret)
    const customerId = decoded.customerId
    const customer = await CustomerModel.findById(customerId)

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    req.customer = customer
    next() // allows us to come out of the middleware and use our controller
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized Access. User must be logged in',
    })
  }
}

export default isAuthenticated