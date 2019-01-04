const Category = require("../models/category");
const Feed = require("../models/feed");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Feed,
          required: true
        }
      ],
      order: ["category_order", "name"]
    });
    return res.status(200).json({
      categories: categories
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findByPk(categoryId, {
      include: [
        {
          model: Feed,
          required: true
        }
      ]
    });
    return res.status(200).json({
      category: category
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const name = req.body.name;
    const category_order = req.body.category_order;
    const category = await Category.create({
      name: name,
      category_order: category_order
    });
    return res.status(200).json(category);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const name = req.body.name;
    const category_order = req.body.category_order;
    category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Category not found."
      });
    } else {
      category.update({
        name: req.body.name,
        category_order: req.body.category_order
      });
      return res.status(200).json(category);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        message: "Category not found."
      });
    } else {
      category.destroy();
      return es.status(204).json({
        message: "Deleted successfully."
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
