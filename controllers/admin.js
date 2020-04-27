
const Product = require('../models/product');
const Category = require('../models/category');

const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 8;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find({ userId: req.user._id })
    .countDocuments()
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find({ userId: req.user._id })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render('admin/product-list', {
            pageTitle: 'Admin Products',
            path: '/admin/admin-products',
            prods: products,
            isAuthenticated: req.session.isLoggedIn,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page <totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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
        res.render('admin/single-product.ejs', {
            pageTitle: 'Product Detail',
            path: '/admin-products',
            prod: product
        })
    })
    .catch(err => {
        console.log(err);
    })
}

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    })
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const image = req.file;
    const category = req.body.category;
    const description = req.body.description;
    const userId = req.user;

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        image: imageUrl,
        category: category,
        description: description,
        userId: userId,
        date: new Date()
    })
    
    product.save()
    .then(results => {
        Category.findOne({ title: category })
        .then(cat => {
            if (!cat) {
                const productCategory = new Category({
                    title: category,
                    image: imageUrl
                })
                productCategory.save()
                .then(result => {
                    console.log('Category created!!');
                })
            }
            console.log('Product Created!!');
            res.redirect('/admin/admin-products');
        })
    })
    .catch(err => {
        console.log(err);
    });
}

exports.getEditProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then( product => {
        res.render('admin/add-product', {
            pageTitle: 'Edit Product',
            path: '/add-product',
            product: product,
            editing: true
        })
    });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const title = req.body.title;
    const price = req.body.price;
    const image = req.file;
    const category = req.body.category;
    const description = req.body.description;

    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return res.redirect('/admin/admin-products')
        }
        product.title = title;
        product.price = price;
        product.category = category;
        product.description = req.body.description;
        product.date = new Date();

        if (image) {
            fileHelper.deleteFile(product.image);
            product.image = image.path;
        }
        return product.save()
        .then(result => {
            console.log('Product Updated');
            res.redirect('/admin/admin-products');
        })
        .catch(err => {
            console.log(err);
        })
    })
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
      .then(product => {
        if (!product) {
          return next(new Error('Product not found'));
        }
        Category.findOne({title: product.category})
        .then(cat => {
            if (cat.image.toString() !== product.image.toString()) {
                fileHelper.deleteFile(product.image);
                console.log('Image Deleted!!')
            } else {
                console.log('Image Not Deleted!!');
            }
        })
        return Product.deleteOne({ _id: prodId, userId: req.user._id });
      })
      .then(() => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({message: 'Success!'});
      })
      .catch(err => {
        res.status(500).json({message: 'Deleteing product failed'});
      });
  };
  