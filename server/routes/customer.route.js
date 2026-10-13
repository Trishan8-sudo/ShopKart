import express from 'express'
import {
  registerCustomer,
  getAllCustomers,
  deleteCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword,
} from '../controllers/customer.controller.js'
import isAuthenticated from '../middlewares/authMiddleware.js'

const customerRoutes = express.Router()

customerRoutes.get('/getAll', getAllCustomers)
customerRoutes.post('/register', registerCustomer)
customerRoutes.delete('/delete/:id', deleteCustomer)
customerRoutes.post('/login', loginCustomer)
customerRoutes.get('/me', isAuthenticated, getMe)
customerRoutes.post('/logout', isAuthenticated, logoutCustomer)
customerRoutes.patch('/change-password', isAuthenticated, changePassword)

export default customerRoutes