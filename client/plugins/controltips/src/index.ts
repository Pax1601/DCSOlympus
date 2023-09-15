import { ControlTipsPlugin } from "./controltipsplugin";

globalThis.getOlympusPlugin = () => {
    return new ControlTipsPlugin();
}