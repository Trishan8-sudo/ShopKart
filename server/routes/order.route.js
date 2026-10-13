import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js'
import {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
} from '../controllers/order.controller.js'

const orderRoutes = express.Router()

// Protected Order Endpoints
orderRoutes.post('/create-payment-order', isAuthenticated, createPaymentOrder)
orderRoutes.post('/verify-payment', isAuthenticated, verifyPayment)
orderRoutes.get('/', isAuthenticated, getOrders)
orderRoutes.get('/:id', isAuthenticated, getOrderById)

export default orderRoutes
