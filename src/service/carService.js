const Tax = require('../entities/tax');
const Transaction = require('../entities/transaction');
const BaseRepository = require('../repository/base/baseRepository');

class CarService {
  constructor({ cars }) {
    this.carRepository = new BaseRepository({ file: cars });

    this.taxesBasedOnAge = Tax.taxesBasedOnAge;

    this.currencyFormat = Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  getRandomPositionFromArray(list) {
    return Math.floor(Math.random() * list.length);
  }

  chooseRandomCar(carCategory) {
    const randomPosition = this.getRandomPositionFromArray(carCategory.carIds);
    return carCategory.carIds[randomPosition];
  }

  async getAvailableCar(carCategory) {
    const carId = this.chooseRandomCar(carCategory);
    const car = await this.carRepository.find(carId);
    return car;
  }

  calculateFinalPrice(customer, carCategory, numberOfDays) {
    const { age } = customer;
    const { price } = carCategory;
    const { then: tax } = this.taxesBasedOnAge.find(
      (tax) => age >= tax.from && age <= tax.to
    );

    const finalPrice = tax * price * numberOfDays;
    const formattedFinalPrice = this.currencyFormat.format(finalPrice);

    return formattedFinalPrice;
  }

  async rent(customer, carCategory, numberOfDays) {
    const car = await this.getAvailableCar(carCategory);
    const finalPrice = this.calculateFinalPrice(
      customer,
      carCategory,
      numberOfDays
    );

    const today = new Date();
    today.setDate(today.getDate() + numberOfDays);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dueDate = today.toLocaleDateString('pt-BR', options);

    const transaction = new Transaction({
      customer,
      car,
      dueDate,
      amount: finalPrice,
    });

    return transaction;
  }
}

module.exports = CarService;
