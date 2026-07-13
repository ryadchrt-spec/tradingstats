import { useState } from "react";
import { useStore } from "../store";
import { ACTIVITY_LEVELS, CALORIE_GOAL_PRESETS, formatSigned } from "../calorieCompute";
import type { Sex } from "../types";

export function ProfileSettings() {
  const profile = useStore((s) => s.data.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <span>Profil (utilisé pour calculer ton métabolisme et ton objectif protéine)</span>
        <span className="text-slate-400 text-xs">{open ? "Masquer ▲" : "Modifier ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Taille (cm)
            <input
              type="number"
              value={profile.heightCm}
              onChange={(e) => setProfile({ heightCm: Number(e.target.value) })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Âge
            <input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ age: Number(e.target.value) })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Sexe
            <select
              value={profile.sex}
              onChange={(e) => setProfile({ sex: e.target.value as Sex })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            >
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 col-span-2 md:col-span-1">
            NAP (niveau d'activité physique)
            <select
              value={profile.activityMultiplier}
              onChange={(e) => setProfile({ activityMultiplier: Number(e.target.value) })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Protéine (g/kg)
            <input
              type="number"
              step={0.1}
              value={profile.proteinPerKg}
              onChange={(e) => setProfile({ proteinPerKg: Number(e.target.value) })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Poids cible (kg)
            <input
              type="number"
              step={0.5}
              value={profile.targetWeightKg ?? ""}
              onChange={(e) => setProfile({ targetWeightKg: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="Optionnel"
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 col-span-2">
            Objectif quotidien (kcal)
            <input
              type="number"
              step={50}
              value={profile.calorieGoal}
              onChange={(e) => setProfile({ calorieGoal: Number(e.target.value) })}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Négatif = déficit (perte de poids), positif = surplus (prise de masse)</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {CALORIE_GOAL_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfile({ calorieGoal: g })}
                  className={`px-2 py-0.5 rounded-full border text-xs ${
                    profile.calorieGoal === g
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {formatSigned(g)}
                </button>
              ))}
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
