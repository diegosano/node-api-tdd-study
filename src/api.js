const http = require('node:http');
const CarService = require('./service/carService');

const DEFAULT_PORT = 3000;
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const defaultFactory = () => ({
  carService: new CarService({ cars: './../database/cars.json' }),
});

class Api {
  constructor(dependencies = defaultFactory()) {
    this.carService = dependencies.carService;
  }

  async calculateFinalPrice(request, response) {
    try {
      for await (const data of request) {
        const { customer, carCategory, numberOfDays } = JSON.parse(data);

        const finalPrice = this.carService.calculateFinalPrice(
          customer,
          carCategory,
          numberOfDays
        );

        response.writeHead(200, DEFAULT_HEADERS);
        response.end(JSON.stringify({ result: finalPrice }));
      }
    } catch {
      response.writeHead(500, DEFAULT_HEADERS)
      response.write(JSON.stringify({ error: 'Ops! Something went wrong.' }))
      response.end()
    }
  }

  async getAvailableCar(request, response) {
    try {
      for await (const data of request) {
        const { carCategory } = JSON.parse(data);

        const availableCars = await this.carService.getAvailableCar(carCategory);

        response.writeHead(200, DEFAULT_HEADERS);
        response.write(JSON.stringify({ result: availableCars }));
        response.end();
      }
    } catch (error) {
      console.log(error)
      response.writeHead(500, DEFAULT_HEADERS)
      response.write(JSON.stringify({ error: 'Ops! Something went wrong.' }))
      response.end()
    }
  }

  generateRoutes() {
    return {
      '/calculate-final-price:post': this.calculateFinalPrice.bind(this),
      '/get-available-car:get': this.getAvailableCar.bind(this),
      default: (request, response) => {
        response.write(JSON.stringify({ success: 'Hello World!' }));
        return response.end();
      },
    };
  }

  handler(request, response) {
    const { url, method } = request;
    const routeKey = `${url}:${method.toLowerCase()}`;

    const routes = this.generateRoutes();
    const chosen = routes[routeKey] || routes.default;

    response.writeHead(200, DEFAULT_HEADERS);

    return chosen(request, response);
  }

  initialize(port = DEFAULT_PORT) {
    const app = http
      .createServer(this.handler.bind(this))
      .listen(port, (_) => console.log('App running at', port));

    return app;
  }
}

if (process.env.NODE_ENV !== 'test') {
  const api = new Api();

  api.initialize();
}

module.exports = (dependencies) => new Api(dependencies);
