import express from 'express'
import {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProduct
} from '../controllers/product.controller.js'

const productRoutes = express.Router()

productRoutes.post('/', createProduct)
productRoutes.get('/', getAllProducts)
productRoutes.get('/:id', getProductById)
productRoutes.delete('/:id',deleteProduct)

export default productRoutes
