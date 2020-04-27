const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/admin-products', isAuth, adminController.getProducts);

router.get('/products/:productId', isAuth, adminController.getProduct);

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product', isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, adminController.postEditProduct);


router.delete('/admin-products/delete/:productId', isAuth, adminController.deleteProduct);

module.exports = router;