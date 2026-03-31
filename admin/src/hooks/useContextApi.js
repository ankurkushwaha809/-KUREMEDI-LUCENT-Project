import { useContext } from "react";
import { ContextApi } from "../context/contextApi";

export const useContextApi = () => useContext(ContextApi);
