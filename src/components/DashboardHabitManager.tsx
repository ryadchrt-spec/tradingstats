import { useStore } from "../store";
import { HabitColumnManager } from "./HabitColumnManager";
import { monthKey as buildMonthKey } from "../dateUtils";
import { FR_MONTHS } from "../habits";

export function DashboardHabitManager({ year, month }: { year: number; month: number }) {
  const habits = useStore((s) => s.data.dashboardHabits);
  const addDashboardHabit = useStore((s) => s.addDashboardHabit);
  const removeDashboardHabit = useStore((s) => s.removeDashboardHabit);
  const renameDashboardHabit = useStore((s) => s.renameDashboardHabit);
  const moveDashboardHabit = useStore((s) => s.moveDashboardHabit);
  const setDashboardHabitTarget = useStore((s) => s.setDashboardHabitTarget);

  const mKey = buildMonthKey(year, month);

  return (
    <HabitColumnManager
      title="Colonnes d'habitudes"
      habits={habits}
      monthKey={mKey}
      monthLabel={`${FR_MONTHS[month]} ${year}`}
      onAdd={addDashboardHabit}
      onRemove={removeDashboardHabit}
      onRename={renameDashboardHabit}
      onMove={moveDashboardHabit}
      onSetTarget={(id, target) => setDashboardHabitTarget(id, mKey, target)}
    />
  );
}
