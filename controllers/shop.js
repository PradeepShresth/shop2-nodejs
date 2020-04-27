const fs = require('fs');
const path = require('path');
const pdfDocument = require('pdfkit');

const Product = require('../models/product');
const Category = require('../models/category');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 6;

exports.getIndex = (req, res, next) => {
    Product.find({ userId: {$ne : req.user}})
    .sort({date: 1})
    .then(products => {
        res.render('shop/index', {
            pageTitle: 'Aroma Shop',
            path: '/',
            prods: products
        })
    })
    .catch(err => {
        console.log(err);
    })
}

exports.getProducts = (req, res, next) => {
    let cat;
    const page = +req.query.page || 1;
    let totalItems;

    Category.find()
    .then(c => {
        if (c) {
            cat = c;
        }
        Product.find({ userId: {$ne : req.user}})
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/products', {
                pageTitle: 'Products',
                path: '/products',
                prods: products,
                cats: cat,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page <totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            })
        })
    })
    .catch(err => {
        console.log(err);
    })
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
    .then(product => {
        if (product) {
            return res.render('shop/single-product', {
                pageTitle: 'Product Description',
                path: '/product',
                prod: product
            });
        }
        res.redirect('/');
    })
}

exports.getCart = (req, res, next) => {
    let totalPrice = 0;
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products = req.user.cart.items;
        products.forEach(prod => {
            totalPrice += prod.productId.price * prod.quantity;
        })
        res.render('shop/cart.ejs', {
            pageTitle: 'Cart',
            path: '/cart',
            prods: products,
            total: totalPrice
        })
    })
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    let q = 1;
    if (req.body.qty) {
        q = req.body.qty;
    }
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product, q);
    })
    .then(result => {
        console.log(result);
        res.redirect('/cart');
    })
}

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    console.log(prodId);
    req.user
    .removeFromCart(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        console.log(err);
    });
}

exports.getOrder = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
    .then(orders => {
        res.render('shop/order.ejs', {
            pageTitle: 'Your Orders',
            path: '/order',
            orders: orders
        });
    })
    .catch(err => {
        console.log(err);
    });
};

exports.postOrder = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products = user.cart.items.map(prod => {
            return { quantity: prod.quantity, product: { ...prod.productId._doc } }
        });
        const order = new Order ({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products,
            date: new Date()
        });
        return order.save();
    })
    .then(() => {
        return req.user.clearCart();
    })
    .then(() => {
        res.redirect('/order');
    })
    .catch(err => {
        console.log(err);
    })
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if (!order) {
            console.log('No orders found')
        }
        if (order.user.userId.toString() !== req.user._id.toString() ) {
            console.log('Unauthorized')
        }
        const invoiceName = 'invoice-'+ orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new pdfDocument();
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename = "' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });
        pdfDoc.text('-------------------------------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        });
        pdfDoc.text('-------------------------------------------');
        pdfDoc.fontSize(18).text('Total Price: ' + totalPrice);
    
        pdfDoc.end();
    })
}

exports.postComment = (req, res, next) => {
    const productId = req.body.productId;
    const name = req.body.name;
    const comment = req.body.comment;

    Product.findById(productId)
    .then(product => {
        return product.addComment(name, comment);
    })
    .then(result => {
        res.redirect('/products/'+ productId);
    })
}