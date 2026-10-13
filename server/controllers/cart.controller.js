import mongoose from 'mongoose'
import { CustomerModel } from '../models/customer.model.js'
import { ProductModel } from '../models/product.model.js'

// 1. Add product to cart (or increase quantity by 1 if already exists)
// POST /cart/:productId
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params

    // Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    // Verify Product exists in database
    const product = await ProductModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    // Find authenticated user
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.cart) {
      user.cart = []
    }

    // Check if product is already in the cart
    const itemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    )

    if (itemIndex > -1) {
      const currentQuantity = user.cart[itemIndex].quantity
      const newQuantity = currentQuantity + 1

      // Validate stock
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Stock limit of ${product.stock} reached.`,
        })
      }

      user.cart[itemIndex].quantity = newQuantity
    } else {
      // Validate stock for initial addition
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Product is currently out of stock',
        })
      }

      user.cart.push({
        product: productId,
        quantity: 1,
      })
    }

    await user.save()
    await user.populate('cart.product')

    const cart = (user.cart || []).filter((item) => item.product !== null)

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

// 2. Get current user's cart populated with product details
// GET /cart
export const getCart = async (req, res) => {
  try {
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId).populate('cart.product')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    const cart = (user.cart || []).filter((item) => item.product !== null)

    return res.status(200).json({
      success: true,
      cart,
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

// 3. Update quantity of a product in cart
// PATCH /cart/:productId
export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params
    const { quantity } = req.body

    // Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    // Validate quantity
    const numQuantity = Number(quantity)
    if (
      !quantity ||
      !Number.isInteger(numQuantity) ||
      numQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid integer and at least 1',
      })
    }

    // Verify product exists
    const product = await ProductModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    // Find authenticated user
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.cart) {
      user.cart = []
    }

    // Find item in cart
    const itemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      })
    }

    // Validate stock
    if (numQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock of ${product.stock}`,
      })
    }

    // Update quantity
    user.cart[itemIndex].quantity = numQuantity
    await user.save()
    await user.populate('cart.product')

    const cart = (user.cart || []).filter((item) => item.product !== null)

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    })
  } catch (error) {
    console.error('Error updating cart quantity:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

// 4. Remove product from current user's cart
// DELETE /cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params

    // Validate Product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    // Find authenticated user
    const userId = req.customer?._id
    const user = await CustomerModel.findById(userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      })
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      })
    }

    user.cart.splice(itemIndex, 1)
    await user.save()
    await user.populate('cart.product')

    const cart = (user.cart || []).filter((item) => item.product !== null)

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart,
    })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}
