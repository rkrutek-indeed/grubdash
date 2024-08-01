const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//validation
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function isPriceValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (typeof price !== 'number' || price < 0) {
        next({status: 400, message: "Dish must have a price that is an integer greater than 0"})
    } else {
        return next()
    }
}

function dishExists(req, res, next) {
    const dishId = Number(req.params.dishId);
    const foundDish = dishes.find((dish) => (dish.id = dishId));
    if (foundDish) {
        res.locals.foundDish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${req.params.dishId}.`,
    });
}

function dishIdMismatch(req, res, next) {
    const {data: {id} = {}} = req.body;
    if (id && id != res.locals.foundDish.id) {
        next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.foundDish.id}`})
    } else {
        return next()
    }
}


//router methods
function list(req, res, next) {
    res.json({data: dishes});
}

function read(req, res, next) {
    const foundDish = res.locals.foundDish
    res.json({ data: foundDish });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function update(req, res) {
    const foundDish = res.locals.foundDish
    const { data: {id, name, description, price, image_url } = {} } = req.body;

    if (id) {
        foundDish.id = id;
    }
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish});
}

module.exports = {
    list,
    read: [
        dishExists,
        read,
    ],
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        isPriceValid,
        create,
    ],
    update:[
        dishExists,
        dishIdMismatch,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        isPriceValid,
        update,
    ],
};