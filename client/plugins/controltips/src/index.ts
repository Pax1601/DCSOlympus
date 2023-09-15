import { ControlTipsPlugin } from "./controltips";

globalThis.getOlympusPlugin = () => {
    return new ControlTipsPlugin();
}