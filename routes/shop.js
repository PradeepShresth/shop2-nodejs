const express = require('express');

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.get('/order', isAuth, shopController.getOrder);

router.post('/order', isAuth, shopController.postOrder);

router.get('/invoice/:orderId', isAuth, shopController.getInvoice);

router.post('/comment', shopController.postComment);

module.exports = router;