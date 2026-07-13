import { useStore } from "../store";
import { HabitColumnManager } from "./HabitColumnManager";

export function HealthHabitManager() {
  const habits = useStore((s) => s.data.healthHabits);
  const addHealthHabit = useStore((s) => s.addHealthHabit);
  const removeHealthHabit = useStore((s) => s.removeHealthHabit);
  const renameHealthHabit = useStore((s) => s.renameHealthHabit);
  const moveHealthHabit = useStore((s) => s.moveHealthHabit);

  return (
    <HabitColumnManager
      title="Colonnes d'habitudes"
      habits={habits}
      onAdd={addHealthHabit}
      onRemove={removeHealthHabit}
      onRename={renameHealthHabit}
      onMove={moveHealthHabit}
    />
  );
}
