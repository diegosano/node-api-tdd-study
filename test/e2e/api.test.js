const Sinon = require('sinon');
const request = require('supertest');
const { join } = require('node:path');
const { expect } = require('chai');

const CarService = require('../../src/service/carService');
const Car = require('../../src/entities/car');
const Customer = require('../../src/entities/customer');

const carsDatabase = join(__dirname, '..', '..', 'database', 'cars.json');

const mocks = {
  validCarCategory: require('../mocks/valid-car-category.json'),
  validCar: require('../mocks/valid-car.json'),
  validCustomer: require('../mocks/valid-customer.json'),
};

describe('E2E API Suite Tests', () => {
  let sandbox = {};
  let app = {};

  before(() => {
    const api = require('../../src/api');
    const carService = new CarService({
      cars: carsDatabase,
    });

    const instance = api({ carService });

    app = {
      instance,
      server: instance.initialize(4000),
    };
  });

  beforeEach(() => {
    sandbox = Sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('/calculate-final-price:post', () => {
    it('should calculate final price from a car category, customer and number of days', async () => {
      const carCategory = {
        ...mocks.validCarCategory,
        price: 37.6,
      };

      const customer = {
        ...mocks.validCustomer,
        age: 50,
      };

      const numberOfDays = 5;

      const expectedResponse = {
        result: app.instance.carService.currencyFormat.format(244.4),
      };

      const response = await request(app.server)
        .post('/calculate-final-price')
        .send({
          customer,
          carCategory,
          numberOfDays,
        });

      expect(response.status).to.be.equal(200);
      expect(response.body).to.be.deep.equal(expectedResponse);
    });
  });

  describe('/get-available-car:get', () => {
    it('should list all available car given a category', async () => {
      const car = mocks.validCar;
      const carCategory = {
        ...mocks.validCarCategory,
        carIds: [car.id],
      };

      const expected = {
        result: car,
      };

      const response = await request(app.server)
        .get('/get-available-car')
        .send({ carCategory });

      expect(response.status).to.be.equal(200);
      expect(response.body).to.be.deep.equal(expected);
    });
  });

  describe('/rent:post', () => {
    it('should rent a car given a customer and a car category', async () => {
      const car = mocks.validCar;
      const carCategory = {
        ...mocks.validCarCategory,
        carIds: [car.id],
      };

      const customer = {
        ...mocks.validCustomer,
        age: 50,
      };

      const numberOfDays = 5;

      const expected = {
        result: {
          car,
          customer,
          amount: 0,
          dueDate: new Date(),
        },
      };

      const response = await request(app.server).post('/rent').send({
        customer,
        carCategory,
        numberOfDays,
      });

      expect(response.status).to.be.equal(200);
      expect(Object.keys(response.body)).to.be.deep.equal(Object.keys(expected));

      const { result } = response.body;
      const expectedCustomer = new Customer(result.customer);
      const expectedCar = new Car(result.car);

      expect(result.customer).to.be.deep.eq(expectedCustomer);
      expect(result.car).to.be.deep.eq(expectedCar);
      expect(result.amount).to.not.be.empty;
      expect(result.dueDate).to.not.be.empty;
    });
  });
});
