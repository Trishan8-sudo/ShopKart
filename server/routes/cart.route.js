import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js'
import {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} from '../controllers/cart.controller.js'

const cartRoutes = express.Router()

// Protected Cart Endpoints
cartRoutes.post('/:productId', isAuthenticated, addToCart)
cartRoutes.get('/', isAuthenticated, getCart)
cartRoutes.patch('/:productId', isAuthenticated, updateQuantity)
cartRoutes.delete('/:productId', isAuthenticated, removeFromCart)

export default cartRoutes
