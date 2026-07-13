import { useStore } from "../store";
import { HabitColumnManager } from "./HabitColumnManager";
import { monthKey as buildMonthKey } from "../dateUtils";
import { FR_MONTHS } from "../habits";

export function HealthHabitManager({ year, month }: { year: number; month: number }) {
  const habits = useStore((s) => s.data.healthHabits);
  const addHealthHabit = useStore((s) => s.addHealthHabit);
  const removeHealthHabit = useStore((s) => s.removeHealthHabit);
  const renameHealthHabit = useStore((s) => s.renameHealthHabit);
  const moveHealthHabit = useStore((s) => s.moveHealthHabit);
  const setHealthHabitTarget = useStore((s) => s.setHealthHabitTarget);

  const mKey = buildMonthKey(year, month);

  return (
    <HabitColumnManager
      title="Colonnes d'habitudes"
      habits={habits}
      monthKey={mKey}
      monthLabel={`${FR_MONTHS[month]} ${year}`}
      onAdd={addHealthHabit}
      onRemove={removeHealthHabit}
      onRename={renameHealthHabit}
      onMove={moveHealthHabit}
      onSetTarget={(id, target) => setHealthHabitTarget(id, mKey, target)}
    />
  );
}
