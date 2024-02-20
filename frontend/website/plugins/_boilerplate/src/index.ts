import { BoilerplatePlugin } from "./boilerplate";

globalThis.getOlympusPlugin = () => {
    return new BoilerplatePlugin();
}