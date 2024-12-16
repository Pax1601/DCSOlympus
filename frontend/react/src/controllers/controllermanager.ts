import { Controller } from "./controller";

export class ControllerManager {
  #controllers: Controller[] = [];

  constructor() {}

  getControllers() {
    return this.#controllers;
  }

  addController(controller: Controller) {
    this.#controllers.push(controller);
  }
}
