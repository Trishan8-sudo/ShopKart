import mongoose from 'mongoose'
import { ProductModel } from '../models/product.model.js'

// 1. Create Product - POST /products
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body

    // Check missing required fields
    if (
      !name || name.toString().trim() === '' || !description || description.toString().trim() === '' || !price || !category || 
      category.toString().trim() === '' || !image || image.trim()==='' || !stock
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field(s)',
      })
    }

    const numPrice = Number(price)
    const numStock = Number(stock)

    // Validate price > 0
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Price must be greater than 0.',
      })
    }

    const newProduct = await ProductModel.create({
      name: name.toString().trim(),
      description: description.toString().trim(),
      price: numPrice,
      category: category.toString().trim(),
      image: image.toString().trim(),
      stock: numStock,
    })

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct,
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create product',
      error: err,
    })
  }
}

// 2. Get All Products with search & category filtering - GET /products
export const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query
    const query = {}

    // Search by name (case-insensitive)
    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim(), $options: 'i' }
    }

    // Filter by category (ignore 'All' or empty)
    if (category && category.trim() !== '' && category.trim().toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') }
    }

    const products = await ProductModel.find(query).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server Error while fetching products',
      error: err.message,
    })
  }
}

// 3. Get Single Product - GET /products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    const product = await ProductModel.findById(id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    return res.status(200).json({
      success: true,
      product,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server Error while fetching product',
      error: err.message,
    })
  }
}

export const deleteProduct = async(req,res)=>{
  const id=req.params.id

  if(!id || !mongoose.Types.ObjectId.isValid(id)){
    return res.status(400).json({
      success:false,
      message:"Invalid Product Id"
    })
  }

  const deletedProduct=await ProductModel.findByIdAndDelete(id)
  if(!deleteProduct) return res.status(404).json({
    success:false,
    message:"Product not found"
  })

  res.status(200).json({
  succcess:true,
  message:"Product deleted successfully",
  product:deletedProduct
  })
}