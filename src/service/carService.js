const BaseRepository = require('../repository/base/baseRepository');

class CarService {
  constructor({ cars }) {
    this.carRepository = new BaseRepository({ file: cars });
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
}

module.exports = CarService;
