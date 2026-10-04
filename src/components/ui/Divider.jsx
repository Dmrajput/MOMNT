import { classNames } from "../../utils/helpers";

export default function Divider({ className = "" }) {
  return (
    <hr
      className={classNames("m-0 border-0 border-t border-border", className)}
    />
  );
}
