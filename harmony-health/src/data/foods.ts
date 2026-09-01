import type { FoodItem } from '../types.ts'

// Curated Israeli & international staples — values per one serving as listed.
// Sources cross-checked against USDA FoodData Central and the Israel Ministry
// of Health tables. Values rounded for UI clarity.
export const FOODS: FoodItem[] = [
  // חלבונים
  { id: 'chicken-breast', name: 'חזה עוף מבושל', category: 'חלבון', servingLabel: '100 גר\'', servingG: 100, kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, tags: ['low-carb', 'high-protein'] },
  { id: 'chicken-thigh', name: 'ירך עוף אפויה', category: 'חלבון', servingLabel: '100 גר\'', servingG: 100, kcal: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 },
  { id: 'salmon', name: 'סלמון אפוי', category: 'חלבון', servingLabel: '100 גר\'', servingG: 100, kcal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, tags: ['mediterranean'] },
  { id: 'tuna-water', name: 'טונה במים', category: 'חלבון', servingLabel: 'קופסה 160 גר\'', servingG: 160, kcal: 176, protein: 40, carbs: 0, fat: 1.5, fiber: 0 },
  { id: 'egg', name: 'ביצה גדולה', category: 'חלבון', servingLabel: 'יחידה (50 גר\')', servingG: 50, kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0 },
  { id: 'egg-white', name: 'חלבון ביצה', category: 'חלבון', servingLabel: 'יחידה', servingG: 33, kcal: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0 },
  { id: 'greek-yogurt', name: 'יוגורט יווני 0%', category: 'חלבון', servingLabel: 'גביע 150 גר\'', servingG: 150, kcal: 90, protein: 15, carbs: 6, fat: 0, fiber: 0 },
  { id: 'cottage-5', name: 'קוטג\' 5%', category: 'חלבון', servingLabel: '100 גר\'', servingG: 100, kcal: 103, protein: 11, carbs: 3, fat: 5, fiber: 0 },
  { id: 'tofu', name: 'טופו', category: 'חלבון', servingLabel: '100 גר\'', servingG: 100, kcal: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, tags: ['vegan'] },
  { id: 'lentils-cooked', name: 'עדשים מבושלות', category: 'חלבון', servingLabel: '1 כוס (200 גר\')', servingG: 200, kcal: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 16, tags: ['vegan', 'high-fiber'] },
  { id: 'chickpeas-cooked', name: 'חומוס מבושל', category: 'חלבון', servingLabel: '1 כוס (164 גר\')', servingG: 164, kcal: 269, protein: 15, carbs: 45, fat: 4, fiber: 13, tags: ['vegan', 'high-fiber'] },

  // פחמימות
  { id: 'oatmeal-dry', name: 'שיבולת שועל (יבשה)', category: 'פחמימות', servingLabel: '40 גר\'', servingG: 40, kcal: 156, protein: 5.4, carbs: 27, fat: 2.7, fiber: 4, tags: ['whole-grain'] },
  { id: 'rice-white', name: 'אורז לבן מבושל', category: 'פחמימות', servingLabel: '1 כוס (158 גר\')', servingG: 158, kcal: 205, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6 },
  { id: 'rice-brown', name: 'אורז מלא מבושל', category: 'פחמימות', servingLabel: '1 כוס (195 גר\')', servingG: 195, kcal: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, tags: ['whole-grain'] },
  { id: 'pasta-cooked', name: 'פסטה מבושלת', category: 'פחמימות', servingLabel: '1 כוס (140 גר\')', servingG: 140, kcal: 220, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5 },
  { id: 'bread-whole', name: 'לחם מלא (פרוסה)', category: 'פחמימות', servingLabel: 'פרוסה (35 גר\')', servingG: 35, kcal: 90, protein: 4, carbs: 15, fat: 1.2, fiber: 2.5 },
  { id: 'pita-whole', name: 'פיתה מקמח מלא', category: 'פחמימות', servingLabel: 'יחידה (60 גר\')', servingG: 60, kcal: 170, protein: 6, carbs: 33, fat: 1.5, fiber: 4.5 },
  { id: 'sweet-potato', name: 'בטטה אפויה', category: 'פחמימות', servingLabel: '150 גר\'', servingG: 150, kcal: 130, protein: 2.4, carbs: 30, fat: 0.2, fiber: 4.5 },
  { id: 'potato', name: 'תפוח אדמה אפוי', category: 'פחמימות', servingLabel: '150 גר\'', servingG: 150, kcal: 130, protein: 3.5, carbs: 30, fat: 0.2, fiber: 3.3 },
  { id: 'quinoa', name: 'קינואה מבושלת', category: 'פחמימות', servingLabel: '1 כוס (185 גר\')', servingG: 185, kcal: 222, protein: 8, carbs: 39, fat: 3.5, fiber: 5 },

  // שומנים בריאים
  { id: 'olive-oil', name: 'שמן זית', category: 'שומן', servingLabel: 'כף (14 גר\')', servingG: 14, kcal: 120, protein: 0, carbs: 0, fat: 14, fiber: 0, tags: ['mediterranean'] },
  { id: 'avocado', name: 'אבוקדו', category: 'שומן', servingLabel: '½ פרי (100 גר\')', servingG: 100, kcal: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7 },
  { id: 'almonds', name: 'שקדים', category: 'שומן', servingLabel: '¼ כוס (30 גר\')', servingG: 30, kcal: 173, protein: 6, carbs: 6, fat: 15, fiber: 3.5 },
  { id: 'walnuts', name: 'אגוזי מלך', category: 'שומן', servingLabel: '¼ כוס (30 גר\')', servingG: 30, kcal: 196, protein: 4.6, carbs: 4, fat: 20, fiber: 2 },
  { id: 'tahini', name: 'טחינה גולמית', category: 'שומן', servingLabel: 'כף (15 גר\')', servingG: 15, kcal: 89, protein: 2.5, carbs: 3, fat: 8, fiber: 1.4 },
  { id: 'peanut-butter', name: 'חמאת בוטנים', category: 'שומן', servingLabel: 'כף (16 גר\')', servingG: 16, kcal: 94, protein: 4, carbs: 3.5, fat: 8, fiber: 1 },

  // ירקות
  { id: 'cucumber', name: 'מלפפון', category: 'ירקות', servingLabel: 'יחידה (150 גר\')', servingG: 150, kcal: 22, protein: 1, carbs: 5, fat: 0.2, fiber: 1.5 },
  { id: 'tomato', name: 'עגבנייה', category: 'ירקות', servingLabel: 'יחידה (120 גר\')', servingG: 120, kcal: 22, protein: 1, carbs: 4.8, fat: 0.2, fiber: 1.5 },
  { id: 'lettuce', name: 'חסה', category: 'ירקות', servingLabel: '1 כוס (50 גר\')', servingG: 50, kcal: 7, protein: 0.6, carbs: 1.3, fat: 0.1, fiber: 1 },
  { id: 'broccoli', name: 'ברוקולי מאודה', category: 'ירקות', servingLabel: '1 כוס (156 גר\')', servingG: 156, kcal: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5 },
  { id: 'spinach', name: 'תרד', category: 'ירקות', servingLabel: '1 כוס (30 גר\')', servingG: 30, kcal: 7, protein: 0.9, carbs: 1, fat: 0.1, fiber: 0.7 },
  { id: 'pepper-red', name: 'פלפל אדום', category: 'ירקות', servingLabel: 'יחידה (120 גר\')', servingG: 120, kcal: 37, protein: 1.2, carbs: 7, fat: 0.4, fiber: 2.5 },
  { id: 'carrot', name: 'גזר', category: 'ירקות', servingLabel: 'יחידה (60 גר\')', servingG: 60, kcal: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7 },
  { id: 'onion', name: 'בצל', category: 'ירקות', servingLabel: 'יחידה (110 גר\')', servingG: 110, kcal: 44, protein: 1.2, carbs: 10, fat: 0.1, fiber: 1.9 },
  { id: 'zucchini', name: 'קישוא', category: 'ירקות', servingLabel: 'יחידה (200 גר\')', servingG: 200, kcal: 34, protein: 2.4, carbs: 6.6, fat: 0.6, fiber: 2 },

  // פירות
  { id: 'apple', name: 'תפוח', category: 'פירות', servingLabel: 'בינוני (180 גר\')', servingG: 180, kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { id: 'banana', name: 'בננה', category: 'פירות', servingLabel: 'בינונית (120 גר\')', servingG: 120, kcal: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3 },
  { id: 'strawberry', name: 'תותים', category: 'פירות', servingLabel: '1 כוס (150 גר\')', servingG: 150, kcal: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3 },
  { id: 'blueberry', name: 'אוכמניות', category: 'פירות', servingLabel: '1 כוס (150 גר\')', servingG: 150, kcal: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 },
  { id: 'orange', name: 'תפוז', category: 'פירות', servingLabel: 'בינוני (150 גר\')', servingG: 150, kcal: 72, protein: 1.3, carbs: 18, fat: 0.2, fiber: 3.4 },
  { id: 'grape', name: 'ענבים', category: 'פירות', servingLabel: '1 כוס (150 גר\')', servingG: 150, kcal: 104, protein: 1, carbs: 27, fat: 0.2, fiber: 1.4 },
  { id: 'date', name: 'תמר מג\'הול', category: 'פירות', servingLabel: 'יחידה (24 גר\')', servingG: 24, kcal: 66, protein: 0.4, carbs: 18, fat: 0, fiber: 1.6 },

  // חטיפים ומוכנים
  { id: 'protein-bar', name: 'חטיף חלבון', category: 'חטיפים', servingLabel: 'יחידה (60 גר\')', servingG: 60, kcal: 220, protein: 20, carbs: 22, fat: 7, fiber: 4 },
  { id: 'dark-chocolate', name: 'שוקולד מריר 70%', category: 'חטיפים', servingLabel: '¼ טבלה (25 גר\')', servingG: 25, kcal: 145, protein: 2, carbs: 11, fat: 10, fiber: 3 },
  { id: 'popcorn-plain', name: 'פופקורן טבעי', category: 'חטיפים', servingLabel: '3 כוסות (24 גר\')', servingG: 24, kcal: 93, protein: 3, carbs: 19, fat: 1, fiber: 3.5 },
  { id: 'rice-cake', name: 'פריכית אורז', category: 'חטיפים', servingLabel: 'יחידה (9 גר\')', servingG: 9, kcal: 35, protein: 0.7, carbs: 7.3, fat: 0.3, fiber: 0.3 },

  // משקאות
  { id: 'coffee-black', name: 'קפה שחור', category: 'משקאות', servingLabel: 'כוס (240 מ"ל)', servingG: 240, kcal: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { id: 'milk-1', name: 'חלב 1%', category: 'משקאות', servingLabel: '1 כוס (240 מ"ל)', servingG: 240, kcal: 100, protein: 8, carbs: 12, fat: 2.4, fiber: 0 },
  { id: 'almond-milk', name: 'חלב שקדים לא ממותק', category: 'משקאות', servingLabel: '1 כוס (240 מ"ל)', servingG: 240, kcal: 30, protein: 1, carbs: 1.4, fat: 2.5, fiber: 0.5 },
]

export const FOOD_CATEGORIES = ['הכול', 'חלבון', 'פחמימות', 'שומן', 'ירקות', 'פירות', 'חטיפים', 'משקאות']
