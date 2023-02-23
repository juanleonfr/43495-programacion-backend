import { model } from 'mongoose';
import { logger } from '../utils/winstonLogger.js';
import orderModel from '../models/orderModel.js';
const errMessage = (err, func) => {
	logger.error(`Date: ${Date.now()} \n Error while running ${func}\n ${err}`);
};

class MongoContainer {
	constructor(modelDat) {
		this.model = model(modelDat.name, modelDat.schema);
		this.schema = modelDat.schema;
	}

	assignId = async () => {
		let id;
		try {
			const thisList = await this.getAll();
			if (thisList.length === 0) {
				id = 1;
			} else {
				const lastElement = thisList.slice(-1)[0];
				id = lastElement.id + 1;
			}
			return id;
		} catch (err) {
			errMessage(err, 'assignId');
		}
	};

	getAll = async () => {
		try {
			const objs = await this.model.find().sort({ id: 1 });
			return objs;
		} catch (err) {
			errMessage(err, 'getAll');
		}
	};

	getById = async (id) => {
		try {
			const res = await this.model.find({ id: id });
			if (res.length > 0) {
				return res[0];
			}
			return { error: 'producto no encontrado' };
		} catch (err) {
			errMessage(err, 'getById');
		}
	};

	saveNew = async (obj) => {
		try {
			obj.id = await this.assignId();
			obj.timestamp = Date.now();
			const res = await this.model.create(obj);
			return res;
		} catch (err) {
			errMessage(err, 'saveNew');
		}
	};

	updateById = async (id, body) => {
		try {
			const docUpdate = await this.model.updateOne({ id: id }, body, { new: true });
			const res = { ...docUpdate, updated: this.getById(id) };
			return res;
		} catch (err) {
			errMessage(err, 'updateById');
		}
	};

	deleteById = async (id) => {
		try {
			const res = await this.model.deleteOne({ id: id });
			return { success: true, res: res };
		} catch (err) {
			errMessage(err, 'deleteById');
		}
	};

	deleteAll = async () => {
		try {
			const res = await this.model.deleteMany({});
			return { success: true, res: res };
		} catch (err) {
			errMessage(err, 'deleteAll');
		}
	};

	newCart = async (body) => {
		let cart = {};
		try {
			cart.id = body.id;
			cart.timestamp = Date.now();
			cart.products = body.products;
			const res = await this.model.create(cart);
			return res;
		} catch (err) {
			errMessage(err, 'newCart');
		}
	};

	addToCart = async (id, product) => {
		try {
			let cart = await this.getById(id);
			const found = cart.products.find((element) => element.id === product.id);
			if (typeof found !== 'undefined') {
				return [{ success: false, issue: 'product already in cart' }];
			}
			cart.products.push(product);
			return this.updateById(id, cart);
		} catch (err) {
			errMessage(err, 'addToCart');
		}
	};

	removeCart = async (id) => {
		try {
			const res = await this.model.deleteMany({ id: id });
			return { success: true, res: res };
		} catch (err) {
			errMessage(err, 'removeCart');
		}
	};

	removeFromCart = async (id, id_prod) => {
		try {
			let cart = await this.getById(id);
			if (isNaN(id_prod)) return [{ success: false, issue: 'invalid id' }];
			let productInCart = cart.products.find((element) => element.id === Number(id_prod));
			if (typeof productInCart === 'undefined') return [{ success: false, issue: 'product not present in cart' }];
			cart.products = cart.products.filter((element) => element.id != id_prod);
			return this.updateById(id, cart);
		} catch (err) {
			errMessage(err, 'removeFromCart');
		}
	};

	placeOrder = async (cart) => {
		try {
			// console.log(cart);
			const res = await orderModel.create(cart);
			return res;
		} catch (err) {
			errMessage(err, 'placeOrder');
		}
	};
}

export default MongoContainer;
