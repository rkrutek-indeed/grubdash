const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const controller = require("../dishes/dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

// TODO: Implement the /orders handlers needed to make the tests pass

// validations
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function hasDishes(req, res, next) {
    const { data: { dishes } } = req.body;
    if (!Array.isArray(dishes) || dishes.length === 0) {
        next({status: 400, message: "Order must include at least one dish"})
    } else {
        return next()
    }
}

function hasValidDishes(req, res, next) {
    const { data: { dishes } } = req.body;
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        const dishQuantity = dish["quantity"]
        if (!dishQuantity || dishQuantity <0 || typeof dishQuantity !== 'number' ) {
            next({status: 400, message: `dish ${i} must have a quantity that is an integer greater than 0`})
        }
    }
    return next()
}

function orderExists(req, res, next) {
    const orderId = Number(req.params.orderId);
    const foundOrder = orders.find((order) => (order.id = orderId));
    if (foundOrder) {
        res.locals.foundOrder = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${req.params.orderId}.`,
    });
}

function orderIdMismatch(req, res, next) {
    const {data: {id} = {}} = req.body;
    if (id && id != res.locals.foundOrder.id) {
        next({status: 400, message: `Order id does not match route id. Dish: ${id}, Route: ${res.locals.foundOrder.id}`})
    } else {
        return next()
    }
}

function hasValidStatus(req, res, next) {
    const {data: {status} = {}} = req.body;
    if (status === 'invalid') {
        next({status: 400, message: `status is invalid`})
    } else {
        return next()
    }
}

function hasPendingStatus(req, res, next) {
    if (res.locals.foundOrder.status !== 'pending') {
        next({status: 400, message: `An order cannot be deleted unless it is pending. Returns a 400 status code`})
    } else {
        return next()
    }
}


//router functions

function list(req, res, next) {
    res.json({data: orders});
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}


function read(req, res, next) {
    const foundOrder = res.locals.foundOrder

    res.json({ data: foundOrder });
}

function update(req, res) {
    const foundOrder = res.locals.foundOrder
    const { data: {id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if (id) {
        foundOrder.id = id;
    } else {
        foundOrder.id = foundOrder.id.toString();
    }
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;

    res.json({ data: foundOrder});
}

function destroy(req, res) {
    const orderId = Number(req.params.orderId);
    const index = orders.findIndex((order) => order.id === Number(orderId));
    if (index > -1) {
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}




module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        hasDishes,
        hasValidDishes,
        create,
    ],
    read:[
        orderExists,
        read,
    ],
    update: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        hasDishes,
        hasValidDishes,
        orderExists,
        orderIdMismatch,
        hasValidStatus,
        update,
    ],
    delete: [
        orderExists,
        hasPendingStatus,
        destroy
    ],


}