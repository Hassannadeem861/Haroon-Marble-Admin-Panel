import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "./helperFunctions.js";

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_factory: "bg-blue-50 text-blue-700 border-blue-200",
  ready: "bg-violet-50 text-violet-700 border-violet-200",
  on_the_way: "bg-indigo-50 text-indigo-700 border-indigo-200",
  received: "bg-sky-50 text-sky-700 border-sky-200",
  checked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  unpaid: "bg-red-50 text-red-700 border-red-200",
  partially_paid: "bg-orange-50 text-orange-700 border-orange-200",
  fully_paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  arrived: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={`font-medium capitalize ${
        statusClasses[status] ||
        "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}