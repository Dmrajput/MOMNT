import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { stepIndex } from "./BookingProgress";

let previousIndex = 0;

export default function useStepDirection() {
  const { pathname } = useLocation();
  const index = stepIndex(pathname);
  const direction = index >= previousIndex ? 1 : -1;

  useEffect(() => {
    previousIndex = index;
  }, [index]);

  return direction;
}
