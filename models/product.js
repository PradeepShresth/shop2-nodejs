const mongoose = require('mongoose');

const Scheme = mongoose.Schema;

const productSchema = new Scheme({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: Scheme.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    comment: {
        items: [{
            username: { type: String, required: true },
            comment: { type: String, required: true },
            date: { type: Date }
        }]
    }
});

productSchema.methods.addComment = function(name, comment) {
    const CommentItems = [...this.comment.items];
    CommentItems.push({
        username: name,
        comment: comment,
        date: new Date()
    });
    const updatedComment = {
        items: CommentItems
    };
    this.comment = updatedComment;
    return this.save();
}

module.exports = mongoose.model('Product', productSchema);