import mongoose from 'mongoose'
import { CustomerModel } from '../models/customer.model.js'
import { ProductModel } from '../models/product.model.js'

// 1. Add product to current user's wishlist
// POST /wishlist/:productId
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params

    // 1. Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      })
    }

    // 2. Verify Product exists in database
    const product = await ProductModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // 3. Find current authenticated user
    const userId =  req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Initialize wishlist array if undefined
    if (!user.wishlist) {
      user.wishlist = []
    }

    // 4. Check if product is already in the wishlist (Prevent duplicates)
    const isAlreadyInWishlist = user.wishlist.some(
      (p) => (p?._id || p).toString() === productId.toString()
    )

    if (isAlreadyInWishlist) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist'
      })
    }

    // 5. Append Product reference and save
    user.wishlist.push(productId)
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist'
    })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// 2. Get current user's wishlist populated with product details
// GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.customer?._id

    // Populate the wishlist field with Product documents
    const user = await CustomerModel.findById(userId).populate('wishlist')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Filter out any null references if products were deleted from DB
    const wishlistItems = (user.wishlist || []).filter((item) => item !== null)

    return res.status(200).json({
      success: true,
      count: wishlistItems.length,
      wishlist: wishlistItems
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// 3. Remove product from current user's wishlist
// DELETE /wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params

    // 1. Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      })
    }

    // 2. Find current authenticated user
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist'
      })
    }

    // 3. Check if product exists in user's wishlist
    const itemIndex = user.wishlist.findIndex(
      (id) => (id?._id || id).toString() === productId.toString()
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist'
      })
    }

    // 4. Remove product ObjectId and save
    user.wishlist.splice(itemIndex, 1)
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// 4. Bonus: Toggle product in wishlist
// PATCH /wishlist/:productId/toggle
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params

    // 1. Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      })
    }

    // 2. Verify Product exists in database
    const product = await ProductModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // 3. Find current authenticated user
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.wishlist) {
      user.wishlist = []
    }

    const itemIndex = user.wishlist.findIndex(
      (id) => (id?._id || id).toString() === productId.toString()
    )

    if (itemIndex !== -1) {
      // Remove product
      user.wishlist.splice(itemIndex, 1)
      await user.save()
      return res.status(200).json({
        success: true,
        saved: false,
        message: 'Product removed from wishlist'
      })
    } else {
      // Add product
      user.wishlist.push(productId)
      await user.save()
      return res.status(200).json({
        success: true,
        saved: true,
        message: 'Product added to wishlist'
      })
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
