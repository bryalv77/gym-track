import type { ExerciseType, MetricField } from '../types';

/** Default metric fields per exercise type. Coaches can tweak them per exercise. */
export const EXERCISE_PRESETS: Record<ExerciseType, MetricField[]> = {
  strength: [
    { key: 'sets', label: 'sets', unit: '', min: 1, max: 20, step: 1, defaultValue: 3 },
    { key: 'reps', label: 'reps', unit: '', min: 1, max: 50, step: 1, defaultValue: 10 },
    { key: 'weightKg', label: 'weight', unit: 'kg', min: 0, max: 400, step: 2.5, defaultValue: 40 },
  ],
  cardio: [
    { key: 'minutes', label: 'time', unit: 'min', min: 1, max: 180, step: 1, defaultValue: 20 },
    { key: 'speed', label: 'speed', unit: 'km/h', min: 0, max: 30, step: 0.5, defaultValue: 8 },
  ],
  other: [
    { key: 'minutes', label: 'time', unit: 'min', min: 1, max: 180, step: 1, defaultValue: 10 },
  ],
};

export type Lang = 'en' | 'es' | 'pt' | 'de' | 'fr';
export const LANGS: Lang[] = ['en', 'es', 'pt', 'de', 'fr'];

export interface DefaultExerciseText {
  name: string;
  description: string;
}

export interface DefaultExercise {
  id: string;
  order: number;
  text: Record<Lang, DefaultExerciseText>;
  videoUrl: string;
  match: { has: string[][]; not: string[] };
  sets: number;
  reps: number;
  weightKg: number;
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  {
    id: 'default_incline_barbell_bench_press',
    order: 1,
    text: {
      es: {
        name: 'Press inclinado con barra',
        description:
          'Banco a 30–45°. Baja la barra a la parte alta del pecho y empuja sin separar la espalda del banco.',
      },
      en: {
        name: 'Incline Barbell Bench Press',
        description:
          'Bench at 30–45°. Lower the bar to the upper chest and press up keeping your back on the bench.',
      },
      pt: {
        name: 'Supino inclinado com barra',
        description:
          'Banco a 30–45°. Baixe a barra até a parte superior do peito e empurre sem descolar as costas do banco.',
      },
      de: {
        name: 'Schrägbankdrücken mit der Langhantel',
        description:
          'Bank auf 30–45°. Senke die Stange zur oberen Brust und drücke hoch, ohne den Rücken von der Bank zu lösen.',
      },
      fr: {
        name: 'Développé incliné à la barre',
        description:
          'Banc à 30–45°. Descends la barre en haut de la poitrine et pousse sans décoller le dos du banc.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=5kyLUGVq_pk',
    match: {
      has: [
        ['inclinad', 'incline', 'schrag'],
        ['press', 'banca', 'bench', 'supino', 'developpe', 'druecken'],
      ],
      not: ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_single_arm_dumbbell_row',
    order: 2,
    text: {
      es: {
        name: 'Remo con mancuerna a una mano',
        description:
          'Apoya una mano y rodilla en el banco. Lleva la mancuerna hacia la cadera con la espalda recta.',
      },
      en: {
        name: 'Single-Arm Dumbbell Row',
        description:
          'One hand and knee on the bench. Pull the dumbbell toward your hip with a flat back.',
      },
      pt: {
        name: 'Remada unilateral com halter',
        description:
          'Apoie uma mão e um joelho no banco. Puxe o halter em direção ao quadril com as costas retas.',
      },
      de: {
        name: 'Einarmiges Kurzhantelrudern',
        description:
          'Eine Hand und ein Knie auf der Bank. Ziehe die Hantel mit geradem Rücken zur Hüfte.',
      },
      fr: {
        name: 'Rowing haltère à un bras',
        description:
          'Une main et un genou sur le banc. Tire l’haltère vers la hanche en gardant le dos plat.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=fURsHPHgssI',
    match: {
      has: [
        ['remo', 'row', 'remada', 'rudern'],
        ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
      ],
      not: ['barra', 'barbell', 'langhantel'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
  {
    id: 'default_dumbbell_biceps_curl',
    order: 3,
    text: {
      es: {
        name: 'Curl de bíceps con mancuernas',
        description:
          'Codos pegados al torso. Sube controlado y baja despacio sin balancear el cuerpo.',
      },
      en: {
        name: 'Dumbbell Biceps Curl',
        description:
          'Elbows tucked at your sides. Curl up under control and lower slowly without swinging.',
      },
      pt: {
        name: 'Rosca bíceps com halteres',
        description:
          'Cotovelos junto ao tronco. Suba com controle e desça devagar sem balançar o corpo.',
      },
      de: {
        name: 'Bizepscurls mit Kurzhanteln',
        description:
          'Ellbogen am Körper. Kontrolliert hochführen und langsam absenken, ohne zu schwingen.',
      },
      fr: {
        name: 'Curl biceps aux haltères',
        description:
          'Coudes collés au corps. Monte de façon contrôlée et redescends lentement sans te balancer.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=Jfp4b5Olc7A',
    match: {
      has: [
        ['curl', 'rosca'],
        ['mancuerna', 'dumbbell', 'halter', 'kurzhantel', 'haltere'],
      ],
      not: ['martillo', 'hammer', 'martelo', 'concentr', 'predicador', 'preacher', 'inclin'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
  {
    id: 'default_barbell_deadlift',
    order: 4,
    text: {
      es: {
        name: 'Peso muerto con barra',
        description:
          'Barra pegada a las piernas, espalda neutra. Empuja el suelo con las piernas y extiende la cadera.',
      },
      en: {
        name: 'Barbell Deadlift',
        description:
          'Bar close to your legs, neutral spine. Drive through the floor and extend your hips.',
      },
      pt: {
        name: 'Levantamento terra com barra',
        description:
          'Barra junto às pernas, coluna neutra. Empurre o chão com as pernas e estenda o quadril.',
      },
      de: {
        name: 'Kreuzheben mit der Langhantel',
        description:
          'Stange nah an den Beinen, neutrale Wirbelsäule. Drücke dich vom Boden ab und strecke die Hüfte.',
      },
      fr: {
        name: 'Soulevé de terre à la barre',
        description:
          'Barre près des jambes, dos neutre. Pousse dans le sol et étends les hanches.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=4i6RTcFhrKc',
    match: {
      has: [['peso muerto', 'deadlift', 'levantamiento terra', 'kreuzheben', 'souleve']],
      not: [
        'rumano',
        'romanian',
        'rdl',
        'sumo',
        'mancuerna',
        'dumbbell',
        'rigid',
        'stiff',
        'trap',
        'hex',
        'una pierna',
        'single',
      ],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_barbell_back_squat',
    order: 5,
    text: {
      es: {
        name: 'Sentadilla trasera con barra',
        description:
          'Barra sobre los trapecios, pecho arriba. Baja hasta al menos paralelo y sube empujando con los talones.',
      },
      en: {
        name: 'Barbell Back Squat',
        description:
          'Bar on your upper back, chest up. Squat to at least parallel and drive up through your heels.',
      },
      pt: {
        name: 'Agachamento livre com barra',
        description:
          'Barra sobre os trapézios, peito aberto. Desça até pelo menos paralelo e suba empurrando com os calcanhares.',
      },
      de: {
        name: 'Kniebeuge mit der Langhantel',
        description:
          'Stange auf dem oberen Rücken, Brust raus. Beuge mindestens bis parallel und drücke dich über die Fersen hoch.',
      },
      fr: {
        name: 'Squat arrière à la barre',
        description:
          'Barre sur le haut du dos, poitrine haute. Descends au moins à la parallèle et remonte en poussant sur les talons.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=8PMjqgR8Wa8',
    match: {
      has: [['sentadilla', 'squat', 'agachamento', 'kniebeuge']],
      not: [
        'frontal',
        'front',
        'goblet',
        'bulgar',
        'split',
        'hack',
        'sumo',
        'mancuerna',
        'dumbbell',
        'salto',
        'jump',
        'overhead',
        'pistol',
        'zercher',
        'smith',
        'multipower',
        'cajon',
        'box',
        'una pierna',
      ],
    },
    sets: 5,
    reps: 15,
    weightKg: 15,
  },
  {
    id: 'default_dumbbell_pullover',
    order: 6,
    text: {
      es: {
        name: 'Pullover con mancuerna',
        description:
          'Tumbado en el banco, baja la mancuerna detrás de la cabeza con los brazos casi rectos y vuelve al pecho.',
      },
      en: {
        name: 'Dumbbell Pullover',
        description:
          'Lying on a bench, lower the dumbbell behind your head with nearly straight arms and return over the chest.',
      },
      pt: {
        name: 'Pullover com halter',
        description:
          'Deitado no banco, baixe o halter atrás da cabeça com os braços quase estendidos e volte sobre o peito.',
      },
      de: {
        name: 'Kurzhantel-Pullover',
        description:
          'Auf der Bank liegend, senke die Hantel mit fast gestreckten Armen hinter den Kopf und führe sie zurück über die Brust.',
      },
      fr: {
        name: 'Pull-over à l’haltère',
        description:
          'Allongé sur un banc, descends l’haltère derrière la tête, bras presque tendus, puis ramène-le au-dessus de la poitrine.',
      },
    },
    videoUrl: 'https://www.youtube.com/watch?v=tcHaHIQStsk',
    match: {
      has: [['pullover', 'pull over']],
      not: ['polea', 'cable', 'barra', 'barbell', 'maquina', 'machine'],
    },
    sets: 5,
    reps: 15,
    weightKg: 7,
  },
];

/** Lowercase, accent-free, punctuation-free text for fuzzy name matching. */
function plain(value: string): string {
  return ` ${value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

/**
 * True when `name` is an existing equivalent of the starter exercise: every
 * group in `match.has` needs one of its words in the name and none of
 * `match.not` may appear (accents, case and punctuation are ignored).
 */
export function matchesDefault(item: DefaultExercise, name: string): boolean {
  const text = plain(name);
  return (
    item.match.has.every((group) => group.some((word) => text.includes(plain(word).trim()))) &&
    !item.match.not.some((word) => text.includes(plain(word).trim()))
  );
}

/** Strength preset fields with the starter exercise's own sets/reps/weight defaults. */
export function starterMetricFields(item: DefaultExercise): MetricField[] {
  const values: Record<string, number> = {
    sets: item.sets,
    reps: item.reps,
    weightKg: item.weightKg,
  };
  return EXERCISE_PRESETS.strength.map((field) => ({
    ...field,
    defaultValue: values[field.key] ?? field.defaultValue,
  }));
}
