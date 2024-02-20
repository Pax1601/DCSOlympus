import { DatabaseManagerPlugin } from "./databasemanagerplugin";

globalThis.getOlympusPlugin = () => {
    return new DatabaseManagerPlugin();
}