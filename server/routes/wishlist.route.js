import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js'
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '../controllers/wishlist.controller.js'

const wishlistRoutes = express.Router()

// Protected Wishlist Endpoints
wishlistRoutes.post('/:productId', isAuthenticated, addToWishlist)
wishlistRoutes.get('/', isAuthenticated, getWishlist)
wishlistRoutes.delete('/:productId', isAuthenticated, removeFromWishlist)
wishlistRoutes.patch('/:productId/toggle', isAuthenticated, toggleWishlist)

export default wishlistRoutes
