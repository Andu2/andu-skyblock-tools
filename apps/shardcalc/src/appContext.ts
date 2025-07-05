import { createContext } from "solid-js";
import { getShardViewModel } from "./view";

const vm = getShardViewModel();

export const AppContext = createContext({
  vm,
});
