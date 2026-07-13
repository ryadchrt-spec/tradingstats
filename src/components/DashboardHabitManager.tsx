import { useStore } from "../store";
import { HabitColumnManager } from "./HabitColumnManager";

export function DashboardHabitManager() {
  const habits = useStore((s) => s.data.dashboardHabits);
  const addDashboardHabit = useStore((s) => s.addDashboardHabit);
  const removeDashboardHabit = useStore((s) => s.removeDashboardHabit);
  const renameDashboardHabit = useStore((s) => s.renameDashboardHabit);
  const moveDashboardHabit = useStore((s) => s.moveDashboardHabit);
  const setDashboardHabitTarget = useStore((s) => s.setDashboardHabitTarget);

  return (
    <HabitColumnManager
      title="Colonnes d'habitudes"
      habits={habits}
      onAdd={addDashboardHabit}
      onRemove={removeDashboardHabit}
      onRename={renameDashboardHabit}
      onMove={moveDashboardHabit}
      onSetTarget={setDashboardHabitTarget}
    />
  );
}
