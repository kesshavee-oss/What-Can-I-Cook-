// Nutrition values are estimates for planning, not medical advice.

export const INGREDIENTS = [
  // Vegetables (27)
  { id: "onion", name: "Onion", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["pyaz", "red onion", "yellow onion"], assumedAvailable: false, expiryDate: "2026-12-08", visual: { color: "#F6E3EA", icon: "root" } },
  { id: "tomato", name: "Tomato", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["tamatar", "roma tomato"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#FDE5DF", icon: "fruit" } },
  { id: "potato", name: "Potato", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["aloo", "russet potato"], assumedAvailable: false, expiryDate: "2026-12-12", visual: { color: "#F5E9D3", icon: "root" } },
  { id: "garlic", name: "Garlic", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["lehsun", "garlic cloves"], assumedAvailable: false, expiryDate: "2026-12-20", visual: { color: "#F7F1E5", icon: "root" } },
  { id: "ginger", name: "Ginger", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["adrak", "fresh ginger"], assumedAvailable: false, expiryDate: "2026-12-04", visual: { color: "#F6E8CC", icon: "root" } },
  { id: "green_chilli", name: "Green Chilli", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["hari mirch", "green chili", "serrano"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#E6F4EA", icon: "pepper" } },
  { id: "spinach", name: "Spinach", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["palak", "baby spinach"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#E1F2E6", icon: "leaf" } },
  { id: "bell_pepper", name: "Bell Pepper", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["capsicum", "shimla mirch"], assumedAvailable: false, expiryDate: "2026-11-24", visual: { color: "#E9F5E3", icon: "pepper" } },
  { id: "carrot", name: "Carrot", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["gajar", "carrots"], assumedAvailable: false, expiryDate: "2026-11-30", visual: { color: "#FDECD8", icon: "root" } },
  { id: "green_peas", name: "Green Peas", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["matar", "peas", "frozen peas"], assumedAvailable: false, expiryDate: "2026-12-05", visual: { color: "#E5F4E6", icon: "bean" } },
  { id: "cauliflower", name: "Cauliflower", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["gobi", "gobhi", "phool gobi"], assumedAvailable: false, expiryDate: "2026-11-27", visual: { color: "#F3EFE8", icon: "leaf" } },
  { id: "cucumber", name: "Cucumber", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["kheera", "english cucumber"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#E4F3E8", icon: "fruit" } },
  { id: "cabbage", name: "Cabbage", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["patta gobhi", "band gobhi", "green cabbage"], assumedAvailable: false, expiryDate: "2026-12-01", visual: { color: "#E7F4EA", icon: "leaf" } },
  { id: "sweet_corn", name: "Sweet Corn", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["corn", "corn kernels", "bhutta", "makai"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#FFF2CE", icon: "grain" } },
  { id: "french_beans", name: "French Beans", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["green beans", "beans", "faras bean"], assumedAvailable: false, expiryDate: "2026-11-24", visual: { color: "#E3F2E5", icon: "bean" } },
  { id: "broccoli", name: "Broccoli", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["broccoli florets", "hari gobi"], assumedAvailable: false, expiryDate: "2026-11-23", visual: { color: "#DFF0E3", icon: "leaf" } },
  { id: "coriander_leaves", name: "Coriander Leaves", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["cilantro", "dhania", "hara dhania"], assumedAvailable: false, expiryDate: "2026-11-19", visual: { color: "#E3F4E7", icon: "leaf" } },
  { id: "mint_leaves", name: "Mint Leaves", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["pudina", "fresh mint"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#E0F4EB", icon: "leaf" } },
  { id: "curry_leaves", name: "Curry Leaves", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["kadi patta", "meetha neem"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#E2F1E3", icon: "leaf" } },
  { id: "lemon", name: "Lemon", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["lime", "nimbu", "lemon juice"], assumedAvailable: false, expiryDate: "2026-12-03", visual: { color: "#FFF4CC", icon: "fruit" } },
  { id: "okra", name: "Okra (Bhindi)", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["bhindi", "lady finger", "ladies finger"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#E3F2E1", icon: "pepper" } },
  { id: "brinjal", name: "Brinjal (Eggplant)", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["baingan", "eggplant", "aubergine"], assumedAvailable: false, expiryDate: "2026-11-29", visual: { color: "#EFE6F6", icon: "fruit" } },
  { id: "bottle_gourd", name: "Bottle Gourd (Lauki)", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["lauki", "ghiya", "doodhi", "calabash"], assumedAvailable: false, expiryDate: "2026-12-02", visual: { color: "#E8F4E5", icon: "fruit" } },
  { id: "beetroot", name: "Beetroot", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["chukandar", "beets", "red beet"], assumedAvailable: false, expiryDate: "2026-12-10", visual: { color: "#F7DFEA", icon: "root" } },
  { id: "mushroom", name: "Mushrooms", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["khumbi", "button mushroom", "cremini"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#EFEAE2", icon: "mushroom" } },
  { id: "fenugreek_leaves", name: "Fenugreek Leaves (Methi)", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["methi", "fresh methi", "methi leaves"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#E2F2E4", icon: "leaf" } },
  { id: "radish", name: "Radish (Mooli)", category: "vegetables", isVeg: true, isEgg: false, allergens: [], aliases: ["mooli", "daikon", "white radish"], assumedAvailable: false, expiryDate: "2026-12-04", visual: { color: "#F6EFEF", icon: "root" } },

  // Fruits (14)
  { id: "banana", name: "Banana", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["kela", "ripe banana"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#FFF3CC", icon: "fruit" } },
  { id: "apple", name: "Apple", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["seb", "red apple"], assumedAvailable: false, expiryDate: "2026-12-06", visual: { color: "#FCE5E3", icon: "fruit" } },
  { id: "pomegranate", name: "Pomegranate", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["anar", "pomegranate seeds"], assumedAvailable: false, expiryDate: "2026-12-02", visual: { color: "#F9E0E6", icon: "fruit" } },
  { id: "papaya", name: "Papaya", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["papita", "ripe papaya"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#FDEBD3", icon: "fruit" } },
  { id: "mango", name: "Mango", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["aam", "ripe mango", "alphonso"], assumedAvailable: false, expiryDate: "2026-11-29", visual: { color: "#FFECC7", icon: "fruit" } },
  { id: "orange", name: "Orange", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["santra", "kinnow", "mandarin"], assumedAvailable: false, expiryDate: "2026-12-07", visual: { color: "#FFE8D1", icon: "fruit" } },
  { id: "grapes", name: "Grapes", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["angoor", "green grapes", "black grapes"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#EBF4E2", icon: "fruit" } },
  { id: "pineapple", name: "Pineapple", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["ananas", "pineapple chunks"], assumedAvailable: false, expiryDate: "2026-12-01", visual: { color: "#FFF1C9", icon: "fruit" } },
  { id: "watermelon", name: "Watermelon", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["tarbooz", "tarbuj"], assumedAvailable: false, expiryDate: "2026-11-29", visual: { color: "#FCE2E4", icon: "fruit" } },
  { id: "guava", name: "Guava", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["amrood", "peru"], assumedAvailable: false, expiryDate: "2026-11-30", visual: { color: "#E8F4E5", icon: "fruit" } },
  { id: "pear", name: "Pear", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["nashpati", "babugosha"], assumedAvailable: false, expiryDate: "2026-12-04", visual: { color: "#EFF4DF", icon: "fruit" } },
  { id: "dates", name: "Dates (Khajoor)", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["khajoor", "medjool dates", "khajur"], assumedAvailable: false, expiryDate: "2027-04-15", visual: { color: "#EFE2D4", icon: "fruit" } },
  { id: "kiwi", name: "Kiwi", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["kiwifruit"], assumedAvailable: false, expiryDate: "2026-12-02", visual: { color: "#E7F2DF", icon: "fruit" } },
  { id: "fresh_coconut", name: "Fresh Coconut", category: "fruits", isVeg: true, isEgg: false, allergens: [], aliases: ["nariyal", "grated coconut", "coconut"], assumedAvailable: false, expiryDate: "2026-12-10", visual: { color: "#F2ECE4", icon: "nut" } },

  // Meat & Fish (17, all isVeg: false)
  { id: "chicken_curry_cut", name: "Chicken (Curry Cut)", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["chicken", "chicken thigh", "bone-in chicken", "murgh"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#FCE6E1", icon: "meat" } },
  { id: "chicken_breast", name: "Chicken Breast", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["boneless chicken", "chicken fillet"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#FCE9E5", icon: "meat" } },
  { id: "chicken_keema", name: "Minced Chicken (Keema)", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["ground chicken", "keema"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#FBE5E0", icon: "meat" } },
  { id: "fish_fillet", name: "Fish Fillet", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["fish", "machli", "tilapia", "basa"], assumedAvailable: false, expiryDate: "2026-11-19", visual: { color: "#E6F0FA", icon: "fish" } },
  { id: "prawns", name: "Prawns", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["shrimp", "jhinga"], assumedAvailable: false, expiryDate: "2026-11-19", visual: { color: "#FDE7E1", icon: "fish" } },
  { id: "mutton", name: "Mutton / Lamb", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["lamb", "goat meat", "bakra"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#F7DFDD", icon: "meat" } },
  { id: "chicken_wings", name: "Chicken Wings", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["wings", "murgh wings"], assumedAvailable: false, expiryDate: "2026-11-27", visual: { color: "#FCE5DE", icon: "meat" } },
  { id: "chicken_drumsticks", name: "Chicken Drumsticks", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["tangdi", "chicken legs", "drumsticks"], assumedAvailable: false, expiryDate: "2026-11-27", visual: { color: "#FBE4DC", icon: "meat" } },
  { id: "chicken_liver", name: "Chicken Liver", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["kaleji", "murgh kaleji"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#F5DCDD", icon: "meat" } },
  { id: "turkey_mince", name: "Minced Turkey", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["ground turkey", "turkey keema"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#FBE9E4", icon: "meat" } },
  { id: "duck_meat", name: "Duck Breast", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["duck", "batakh"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#F9E2DF", icon: "meat" } },
  { id: "rohu_fish", name: "Rohu Fish", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["rohu", "katla", "river fish"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#E5EFF8", icon: "fish" } },
  { id: "pomfret", name: "Pomfret", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["paplet", "silver pomfret"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#E8F1F9", icon: "fish" } },
  { id: "salmon", name: "Salmon Fillet", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["rawas", "salmon"], assumedAvailable: false, expiryDate: "2026-11-27", visual: { color: "#FDE9E4", icon: "fish" } },
  { id: "tuna", name: "Tuna", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["canned tuna", "kuppa"], assumedAvailable: false, expiryDate: "2027-06-01", visual: { color: "#E9F0F8", icon: "fish" } },
  { id: "crab", name: "Crab", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["kekda", "crab meat"], assumedAvailable: false, expiryDate: "2026-11-26", visual: { color: "#FDE5DF", icon: "fish" } },
  { id: "lamb_chops", name: "Lamb Chops", category: "meat_fish", isVeg: false, isEgg: false, allergens: [], aliases: ["mutton chops", "chaap"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#F8E0DE", icon: "meat" } },

  // Eggs & Dairy (14)
  { id: "egg", name: "Eggs", category: "eggs_dairy", isVeg: true, isEgg: true, allergens: ["egg"], aliases: ["eggs", "anda", "boiled egg"], assumedAvailable: false, expiryDate: "2026-11-24", visual: { color: "#FFF3D9", icon: "egg" } },
  { id: "paneer", name: "Paneer", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["cottage cheese", "indian cheese"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#FAF5EB", icon: "dairy" } },
  { id: "milk", name: "Milk", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["doodh", "whole milk"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#EDF4FB", icon: "bottle" } },
  { id: "yogurt", name: "Yogurt / Curd", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["curd", "dahi", "plain yogurt"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#F4F1EA", icon: "bowl" } },
  { id: "butter", name: "Butter", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["makhan", "salted butter"], assumedAvailable: false, expiryDate: "2026-12-18", visual: { color: "#FFF2C9", icon: "dairy" } },
  { id: "ghee", name: "Ghee", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["clarified butter", "desi ghee"], assumedAvailable: false, expiryDate: "2027-04-15", visual: { color: "#FCEEC7", icon: "drop" } },
  { id: "cheese", name: "Cheese", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["cheddar", "processed cheese", "cheese slice"], assumedAvailable: false, expiryDate: "2026-12-14", visual: { color: "#FFEFC2", icon: "dairy" } },
  { id: "fresh_cream", name: "Fresh Cream (Malai)", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["malai", "heavy cream", "cooking cream"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#F7F2E8", icon: "bowl" } },
  { id: "buttermilk", name: "Buttermilk (Chaas)", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["chaas", "mattha", "lassi"], assumedAvailable: false, expiryDate: "2026-11-27", visual: { color: "#EFF5FA", icon: "bottle" } },
  { id: "condensed_milk", name: "Condensed Milk", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["milkmaid", "sweetened condensed milk"], assumedAvailable: false, expiryDate: "2027-05-01", visual: { color: "#FBF1D9", icon: "bottle" } },
  { id: "khoya", name: "Khoya (Mawa)", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["mawa", "khoa", "milk solids"], assumedAvailable: false, expiryDate: "2026-11-29", visual: { color: "#F9EFE0", icon: "dairy" } },
  { id: "mozzarella", name: "Mozzarella Cheese", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["pizza cheese", "shredded mozzarella"], assumedAvailable: false, expiryDate: "2026-12-20", visual: { color: "#FBF5E6", icon: "dairy" } },
  { id: "cream_cheese", name: "Cream Cheese", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["spreadable cheese", "mascarpone"], assumedAvailable: false, expiryDate: "2026-12-18", visual: { color: "#F6F1E7", icon: "dairy" } },
  { id: "hung_curd", name: "Hung Curd / Greek Yogurt", category: "eggs_dairy", isVeg: true, isEgg: false, allergens: ["dairy"], aliases: ["chakka dahi", "greek yogurt"], assumedAvailable: false, expiryDate: "2026-11-28", visual: { color: "#F3EFE7", icon: "bowl" } },

  // Grains & Pulses (24)
  { id: "rice", name: "Basmati / White Rice", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["chawal", "basmati rice", "cooked rice"], assumedAvailable: false, expiryDate: "2027-08-20", visual: { color: "#F5EFE4", icon: "grain" } },
  { id: "poha", name: "Poha (Flattened Rice)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["flattened rice", "beaten rice", "chivda"], assumedAvailable: false, expiryDate: "2027-03-15", visual: { color: "#F7EFE0", icon: "grain" } },
  { id: "semolina", name: "Semolina (Suji / Rava)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["suji", "rava", "sooji"], assumedAvailable: false, expiryDate: "2027-03-01", visual: { color: "#FBF0D9", icon: "grain" } },
  { id: "oats", name: "Rolled Oats", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["oatmeal", "quick oats", "jai"], assumedAvailable: false, expiryDate: "2027-05-10", visual: { color: "#F3EAD8", icon: "grain" } },
  { id: "wheat_flour", name: "Whole Wheat Flour (Atta)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["atta", "roti flour", "gehu atta"], assumedAvailable: false, expiryDate: "2027-02-20", visual: { color: "#F4E8D6", icon: "grain" } },
  { id: "bread", name: "Bread Slices", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["toast", "sandwich bread", "double roti"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#F5E7D0", icon: "grain" } },
  { id: "pav", name: "Pav / Soft Buns", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["ladi pav", "dinner rolls", "buns"], assumedAvailable: false, expiryDate: "2026-11-21", visual: { color: "#F6E8CE", icon: "grain" } },
  { id: "idli_batter", name: "Idli / Dosa Batter", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["fermented rice lentil batter", "dosa batter"], assumedAvailable: false, expiryDate: "2026-11-22", visual: { color: "#F5EFE6", icon: "bowl" } },
  { id: "toor_dal", name: "Toor Dal (Yellow Lentils)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["yellow dal", "arhar dal", "split pigeon peas", "dal"], assumedAvailable: false, expiryDate: "2027-07-10", visual: { color: "#FCEAC7", icon: "bean" } },
  { id: "moong_dal", name: "Moong Dal (Split Mung)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["yellow moong", "green gram", "mung dal"], assumedAvailable: false, expiryDate: "2027-07-10", visual: { color: "#FBF0C9", icon: "bean" } },
  { id: "moong_sprouts", name: "Moong Sprouts", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["sprouted mung", "sprouts", "ankurit moong"], assumedAvailable: false, expiryDate: "2026-11-20", visual: { color: "#E6F3E4", icon: "bean" } },
  { id: "rajma", name: "Rajma (Kidney Beans)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["red kidney beans", "kidney beans"], assumedAvailable: false, expiryDate: "2027-08-01", visual: { color: "#F7E1E0", icon: "bean" } },
  { id: "chickpeas", name: "Chickpeas (Chole)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["kabuli chana", "garbanzo beans", "chole"], assumedAvailable: false, expiryDate: "2027-08-01", visual: { color: "#F7EAD7", icon: "bean" } },
  { id: "roasted_chana", name: "Roasted Chana", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["bhuna chana", "roasted chickpeas"], assumedAvailable: false, expiryDate: "2027-02-15", visual: { color: "#F8E9C8", icon: "bean" } },
  { id: "besan", name: "Besan (Gram Flour)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["chickpea flour", "gram flour"], assumedAvailable: false, expiryDate: "2027-03-20", visual: { color: "#FBEEC9", icon: "bowl" } },
  { id: "roti_wrap", name: "Roti / Flatbread", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["chapati", "tortilla", "naan", "phulka"], assumedAvailable: false, expiryDate: "2026-11-25", visual: { color: "#F4E6CE", icon: "grain" } },
  { id: "brown_rice", name: "Brown Rice", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["bhura chawal", "whole grain rice"], assumedAvailable: false, expiryDate: "2027-06-20", visual: { color: "#EFE3D3", icon: "grain" } },
  { id: "quinoa", name: "Quinoa", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["kinwa", "white quinoa"], assumedAvailable: false, expiryDate: "2027-07-01", visual: { color: "#F6EBD8", icon: "grain" } },
  { id: "urad_dal", name: "Urad Dal (Black Gram)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["black urad", "dhuli urad", "makhani dal"], assumedAvailable: false, expiryDate: "2027-07-15", visual: { color: "#EAE6E3", icon: "bean" } },
  { id: "masoor_dal", name: "Masoor Dal (Red Lentils)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["red lentils", "kali masoor", "split red lentils"], assumedAvailable: false, expiryDate: "2027-07-15", visual: { color: "#FCE3D8", icon: "bean" } },
  { id: "chana_dal", name: "Chana Dal (Split Bengal Gram)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["bengal gram", "split chickpeas"], assumedAvailable: false, expiryDate: "2027-07-15", visual: { color: "#FCEBC4", icon: "bean" } },
  { id: "black_chana", name: "Black Chickpeas (Kala Chana)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: [], aliases: ["kala chana", "desi chana"], assumedAvailable: false, expiryDate: "2027-08-10", visual: { color: "#EFE3D7", icon: "bean" } },
  { id: "vermicelli", name: "Vermicelli (Seviyan)", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["seviyan", "semiya", "roasted vermicelli"], assumedAvailable: false, expiryDate: "2027-05-20", visual: { color: "#F7EAD4", icon: "grain" } },
  { id: "pasta", name: "Pasta / Macaroni", category: "grains_pulses", isVeg: true, isEgg: false, allergens: ["gluten"], aliases: ["penne", "macaroni", "fusilli"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#FBECD2", icon: "grain" } },

  // Spices & Herbs (27)
  { id: "turmeric", name: "Turmeric Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["haldi"], assumedAvailable: true, expiryDate: "2027-09-30", visual: { color: "#FFEBC2", icon: "spice" } },
  { id: "red_chilli_powder", name: "Red Chilli Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["lal mirch", "paprika", "chili powder"], assumedAvailable: true, expiryDate: "2027-09-30", visual: { color: "#FCDFD9", icon: "pepper" } },
  { id: "cumin_seeds", name: "Cumin Seeds", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["jeera", "cumin", "zeera"], assumedAvailable: true, expiryDate: "2027-10-15", visual: { color: "#EFE4D4", icon: "spice" } },
  { id: "garam_masala", name: "Garam Masala", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["spice blend", "garam masala powder"], assumedAvailable: true, expiryDate: "2027-08-30", visual: { color: "#EFE1D3", icon: "spice" } },
  { id: "coriander_powder", name: "Coriander Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["dhania powder", "sukha dhania"], assumedAvailable: true, expiryDate: "2027-09-30", visual: { color: "#F4EBD7", icon: "spice" } },
  { id: "mustard_seeds", name: "Mustard Seeds", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["rai", "sarson"], assumedAvailable: true, expiryDate: "2027-10-15", visual: { color: "#EFE6D8", icon: "spice" } },
  { id: "black_pepper", name: "Black Pepper", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["kali mirch", "pepper", "peppercorns"], assumedAvailable: true, expiryDate: "2027-10-30", visual: { color: "#EAE6E1", icon: "spice" } },
  { id: "chaat_masala", name: "Chaat Masala", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["tangy masala"], assumedAvailable: false, expiryDate: "2027-06-30", visual: { color: "#F6E9D8", icon: "spice" } },
  { id: "whole_spices", name: "Whole Spices (Bay Leaf, Cloves, Cardamom)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["khada masala", "bay leaf", "cinnamon", "cardamom"], assumedAvailable: true, expiryDate: "2027-11-15", visual: { color: "#EFE3D3", icon: "spice" } },
  { id: "cumin_powder", name: "Roasted Cumin Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["bhuna jeera", "jeera powder"], assumedAvailable: false, expiryDate: "2027-09-15", visual: { color: "#EFE4D3", icon: "spice" } },
  { id: "fennel_seeds", name: "Fennel Seeds (Saunf)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["saunf", "variyali"], assumedAvailable: false, expiryDate: "2027-10-20", visual: { color: "#E8F2E2", icon: "spice" } },
  { id: "fenugreek_seeds", name: "Fenugreek Seeds (Methi Dana)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["methi dana", "methi seeds"], assumedAvailable: false, expiryDate: "2027-10-20", visual: { color: "#F7E9C8", icon: "spice" } },
  { id: "carom_seeds", name: "Carom Seeds (Ajwain)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["ajwain", "bishop weed"], assumedAvailable: false, expiryDate: "2027-10-20", visual: { color: "#F3E7D4", icon: "spice" } },
  { id: "nigella_seeds", name: "Nigella Seeds (Kalonji)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["kalonji", "onion seeds"], assumedAvailable: false, expiryDate: "2027-10-20", visual: { color: "#E8E5E3", icon: "spice" } },
  { id: "asafoetida", name: "Asafoetida (Hing)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["hing", "heeng"], assumedAvailable: false, expiryDate: "2027-11-01", visual: { color: "#F7EAD3", icon: "spice" } },
  { id: "cardamom", name: "Green Cardamom (Elaichi)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["elaichi", "choti elaichi"], assumedAvailable: false, expiryDate: "2027-11-01", visual: { color: "#E6F1E3", icon: "spice" } },
  { id: "cinnamon", name: "Cinnamon (Dalchini)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["dalchini", "cinnamon stick"], assumedAvailable: false, expiryDate: "2027-11-01", visual: { color: "#F2E1D4", icon: "spice" } },
  { id: "cloves", name: "Cloves (Laung)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["laung", "lavang"], assumedAvailable: false, expiryDate: "2027-11-01", visual: { color: "#EFE1D6", icon: "spice" } },
  { id: "bay_leaf", name: "Bay Leaf (Tej Patta)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["tej patta", "bay leaves"], assumedAvailable: false, expiryDate: "2027-11-01", visual: { color: "#E7F0E3", icon: "leaf" } },
  { id: "dry_red_chilli", name: "Dried Red Chilli", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["sabut lal mirch", "whole red chili"], assumedAvailable: false, expiryDate: "2027-10-01", visual: { color: "#FCE0DA", icon: "pepper" } },
  { id: "kashmiri_chilli", name: "Kashmiri Red Chilli Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["deggi mirch", "kashmiri mirch"], assumedAvailable: false, expiryDate: "2027-09-30", visual: { color: "#FCE1DC", icon: "spice" } },
  { id: "amchur", name: "Dry Mango Powder (Amchur)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["amchoor", "amchur powder"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#F4E9D6", icon: "spice" } },
  { id: "kasuri_methi", name: "Kasuri Methi (Dried Fenugreek)", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["dried fenugreek leaves", "kasoori methi"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#E5F0E3", icon: "leaf" } },
  { id: "oregano", name: "Dried Oregano", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["italian seasoning", "pizza herbs"], assumedAvailable: false, expiryDate: "2027-10-01", visual: { color: "#E6EFE3", icon: "leaf" } },
  { id: "basil_herb", name: "Basil Leaves", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["tulsi", "sweet basil", "dried basil"], assumedAvailable: false, expiryDate: "2027-08-15", visual: { color: "#E2F2E5", icon: "leaf" } },
  { id: "sambar_powder", name: "Sambar Powder", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["sambar masala"], assumedAvailable: false, expiryDate: "2027-08-30", visual: { color: "#FCE6D4", icon: "spice" } },
  { id: "pav_bhaji_masala", name: "Pav Bhaji Masala", category: "spices_herbs", isVeg: true, isEgg: false, allergens: [], aliases: ["bhaji masala"], assumedAvailable: false, expiryDate: "2027-08-30", visual: { color: "#FBE3D7", icon: "spice" } },

  // Pantry (18)
  { id: "oil", name: "Cooking Oil", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["cooking oil", "vegetable oil", "sunflower oil"], assumedAvailable: true, expiryDate: "2027-07-01", visual: { color: "#FFF2C9", icon: "drop" } },
  { id: "salt", name: "Salt", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["namak", "sea salt"], assumedAvailable: true, expiryDate: "2028-12-31", visual: { color: "#F0F2F5", icon: "spice" } },
  { id: "water", name: "Water", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["drinking water", "pani"], assumedAvailable: true, expiryDate: "2028-12-31", visual: { color: "#E4F1FA", icon: "drop" } },
  { id: "jaggery", name: "Jaggery / Sugar", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["gur", "sugar", "brown sugar", "cheeni"], assumedAvailable: true, expiryDate: "2027-11-01", visual: { color: "#F7E5CA", icon: "bowl" } },
  { id: "honey", name: "Honey", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["shahad", "raw honey", "maple syrup"], assumedAvailable: false, expiryDate: "2028-06-01", visual: { color: "#FDEAC4", icon: "bottle" } },
  { id: "peanuts", name: "Peanuts", category: "pantry", isVeg: true, isEgg: false, allergens: ["nut"], aliases: ["moongfali", "roasted peanuts"], assumedAvailable: false, expiryDate: "2027-04-01", visual: { color: "#F5E6D1", icon: "nut" } },
  { id: "soy_sauce", name: "Soy Sauce", category: "pantry", isVeg: true, isEgg: false, allergens: ["soy", "gluten"], aliases: ["dark soy sauce", "light soy sauce"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#EAE2DB", icon: "bottle" } },
  { id: "tomato_ketchup", name: "Tomato Ketchup", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["tomato sauce", "ketchup"], assumedAvailable: false, expiryDate: "2027-06-15", visual: { color: "#FDE2DC", icon: "bottle" } },
  { id: "tamarind", name: "Tamarind (Imli)", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["imli", "tamarind paste"], assumedAvailable: false, expiryDate: "2027-07-15", visual: { color: "#EFE2D7", icon: "bowl" } },
  { id: "coconut_milk", name: "Coconut Milk", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["nariyal doodh", "canned coconut milk"], assumedAvailable: false, expiryDate: "2027-08-01", visual: { color: "#F4EFE9", icon: "bottle" } },
  { id: "vinegar", name: "Vinegar (Sirka)", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["sirka", "white vinegar", "apple cider vinegar"], assumedAvailable: false, expiryDate: "2028-03-01", visual: { color: "#EEF3F7", icon: "bottle" } },
  { id: "sesame_seeds", name: "Sesame Seeds (Til)", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["til", "white sesame", "safed til"], assumedAvailable: false, expiryDate: "2027-05-01", visual: { color: "#F6EFE2", icon: "nut" } },
  { id: "cashews", name: "Cashews (Kaju)", category: "pantry", isVeg: true, isEgg: false, allergens: ["nut"], aliases: ["kaju", "cashew nuts"], assumedAvailable: false, expiryDate: "2027-04-15", visual: { color: "#F8EEDB", icon: "nut" } },
  { id: "almonds", name: "Almonds (Badam)", category: "pantry", isVeg: true, isEgg: false, allergens: ["nut"], aliases: ["badam", "sliced almonds"], assumedAvailable: false, expiryDate: "2027-05-15", visual: { color: "#F3E5D3", icon: "nut" } },
  { id: "raisins", name: "Raisins (Kishmish)", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["kishmish", "dried grapes"], assumedAvailable: false, expiryDate: "2027-04-20", visual: { color: "#F2E3D4", icon: "fruit" } },
  { id: "mustard_oil", name: "Mustard Oil (Sarson Ka Tel)", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["sarson tel", "kachi ghani"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#FDEEC4", icon: "bottle" } },
  { id: "olive_oil", name: "Olive Oil", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["extra virgin olive oil", "jaitun ka tel"], assumedAvailable: false, expiryDate: "2027-09-01", visual: { color: "#EEF3DE", icon: "bottle" } },
  { id: "ginger_garlic_paste", name: "Ginger-Garlic Paste", category: "pantry", isVeg: true, isEgg: false, allergens: [], aliases: ["adrak lehsun paste"], assumedAvailable: false, expiryDate: "2027-02-01", visual: { color: "#F6EED9", icon: "bowl" } },
];

export const INGREDIENT_VISUALS = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing.visual])
);

export const RECIPES = [
  // ======================== BREAKFAST (12) ========================
  {
    id: "masala_omelette",
    name: "Masala Omelette",
    mealTypes: ["breakfast", "snacks"],
    diet: "veg",
    allergens: ["egg"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 8,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: true },
      { ingredientId: "green_chilli", amount: 1, unit: "pcs", optional: true },
      { ingredientId: "coriander_leaves", amount: 2, unit: "tbsp", optional: true },
      { ingredientId: "turmeric", amount: 0.25, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
    ],
    steps: [
      { text: "Beat eggs with turmeric and salt in a bowl until frothy.", timerSeconds: null },
      { text: "Fold in chopped onion, tomato, green chilli, and coriander leaves.", timerSeconds: null },
      { text: "Heat oil in a skillet and cook the egg mixture on medium-low until golden and set.", timerSeconds: 240 },
    ],
    nutritionPerServing: { calories: 215, protein: 14, calcium: 62, iron: 2.1, vitaminC: 11, fiber: 1.2, fat: 15.5, carbs: 5.5 },
    tags: ["high-protein", "quick", "eggs"],
  },
  {
    id: "poha",
    name: "Kanda Batata Poha",
    mealTypes: ["breakfast", "snacks"],
    diet: "veg",
    allergens: ["nut"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "poha", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "potato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "peanuts", amount: 3, unit: "tbsp", optional: true },
      { ingredientId: "mustard_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "curry_leaves", amount: 8, unit: "leaves", optional: true },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Rinse poha briefly in a colander, drain well, and toss with turmeric and salt.", timerSeconds: null },
      { text: "Roast peanuts in oil, set aside, then crackle mustard seeds and curry leaves.", timerSeconds: 90 },
      { text: "Cook diced potato and onion until tender, then steam poha covered for 2 minutes and finish with lemon.", timerSeconds: 360 },
    ],
    nutritionPerServing: { calories: 295, protein: 7, calcium: 28, iron: 2.6, vitaminC: 16, fiber: 3.4, fat: 10, carbs: 45 },
    tags: ["light", "classic", "quick"],
  },
  {
    id: "upma",
    name: "Vegetable Rava Upma",
    mealTypes: ["breakfast"],
    diet: "veg",
    allergens: ["gluten"],
    cuisine: "South Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "semolina", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "mustard_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "curry_leaves", amount: 8, unit: "leaves", optional: true },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "water", amount: 2.5, unit: "cup", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Dry roast semolina on medium-low heat until fragrant and set aside.", timerSeconds: 240 },
      { text: "Heat oil, crackle mustard seeds and curry leaves, then sauté onion, carrot, and peas.", timerSeconds: 180 },
      { text: "Boil salted water, stir in roasted semolina gradually, and steam covered until fluffy.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 310, protein: 8.5, calcium: 34, iron: 2.2, vitaminC: 10, fiber: 4, fat: 9.5, carbs: 48 },
    tags: ["comfort", "warm"],
  },
  {
    id: "idli",
    name: "Steamed Soft Idli",
    mealTypes: ["breakfast"],
    diet: "veg",
    allergens: [],
    cuisine: "South Indian",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "idli_batter", amount: 2, unit: "cup", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Grease idli molds lightly with oil and pour fermented batter three-quarters full.", timerSeconds: null },
      { text: "Steam in a covered steamer over boiling water for 10 to 12 minutes until a toothpick comes out clean.", timerSeconds: 660 },
      { text: "Rest 2 minutes before unmolding gently with a damp spoon.", timerSeconds: 120 },
    ],
    nutritionPerServing: { calories: 230, protein: 7.5, calcium: 30, iron: 1.6, vitaminC: 0, fiber: 2.4, fat: 2, carbs: 45 },
    tags: ["steamed", "fermented", "low-fat"],
  },
  {
    id: "dosa",
    name: "Crisp Masala Dosa",
    mealTypes: ["breakfast", "dinner"],
    diet: "veg",
    allergens: [],
    cuisine: "South Indian",
    difficulty: "medium",
    prepMinutes: 10,
    cookMinutes: 15,
    baseServings: 2,
    ingredients: [
      { ingredientId: "idli_batter", amount: 2, unit: "cup", optional: false },
      { ingredientId: "potato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "mustard_seeds", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "curry_leaves", amount: 6, unit: "leaves", optional: true },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Boil and mash potatoes. Sauté mustard seeds, curry leaves, onion, turmeric, and potato to make filling.", timerSeconds: 300 },
      { text: "Spread a ladle of batter thinly onto a hot griddle in a spiral.", timerSeconds: null },
      { text: "Drizzle oil around edges until crisp, place potato masala inside, and fold.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 365, protein: 9.5, calcium: 40, iron: 2.4, vitaminC: 18, fiber: 4.8, fat: 9.5, carbs: 61 },
    tags: ["crispy", "classic"],
  },
  {
    id: "paratha",
    name: "Aloo Paratha with Curd",
    mealTypes: ["breakfast", "lunch"],
    diet: "veg",
    allergens: ["gluten", "dairy"],
    cuisine: "North Indian",
    difficulty: "medium",
    prepMinutes: 15,
    cookMinutes: 15,
    baseServings: 2,
    ingredients: [
      { ingredientId: "wheat_flour", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "potato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "yogurt", amount: 1, unit: "cup", optional: true },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "green_chilli", amount: 1, unit: "pcs", optional: true },
      { ingredientId: "ghee", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 0.75, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Knead whole wheat flour with water and salt into a soft dough and rest 10 minutes.", timerSeconds: 600 },
      { text: "Mash boiled potatoes with cumin, green chilli, and salt. Stuff into dough balls and roll flat.", timerSeconds: null },
      { text: "Griddle on both sides with ghee until golden brown and serve with yogurt.", timerSeconds: 300 },
    ],
    nutritionPerServing: { calories: 410, protein: 12, calcium: 175, iron: 3.4, vitaminC: 18, fiber: 6.5, fat: 11, carbs: 66 },
    tags: ["hearty", "stuffed"],
  },
  {
    id: "egg_bhurji",
    name: "Mumbai Egg Bhurji",
    mealTypes: ["breakfast", "dinner"],
    diet: "veg",
    allergens: ["egg", "dairy"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 6,
    cookMinutes: 8,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "green_chilli", amount: 1, unit: "pcs", optional: true },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "red_chilli_powder", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "butter", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "coriander_leaves", amount: 2, unit: "tbsp", optional: true },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Melt butter in a pan and sauté chopped onion and green chilli until translucent.", timerSeconds: 150 },
      { text: "Add chopped tomato, turmeric, red chilli powder, and salt; cook until soft.", timerSeconds: 180 },
      { text: "Pour beaten eggs and scramble gently over low heat into soft spiced curds.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 240, protein: 14.5, calcium: 68, iron: 2.2, vitaminC: 12, fiber: 1.5, fat: 17.5, carbs: 6 },
    tags: ["high-protein", "quick", "eggs"],
  },
  {
    id: "oats_porridge",
    name: "Warm Banana Oats Porridge",
    mealTypes: ["breakfast"],
    diet: "veg",
    allergens: ["gluten", "dairy"],
    cuisine: "International",
    difficulty: "easy",
    prepMinutes: 3,
    cookMinutes: 7,
    baseServings: 2,
    ingredients: [
      { ingredientId: "oats", amount: 1, unit: "cup", optional: false },
      { ingredientId: "milk", amount: 2, unit: "cup", optional: false },
      { ingredientId: "banana", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "honey", amount: 2, unit: "tsp", optional: true },
      { ingredientId: "salt", amount: 0.25, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Bring milk and a pinch of salt to a gentle simmer in a saucepan.", timerSeconds: 120 },
      { text: "Stir in rolled oats and cook on low heat, stirring occasionally, until creamy.", timerSeconds: 300 },
      { text: "Top with sliced ripe banana and drizzle with honey.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 330, protein: 12.5, calcium: 310, iron: 2.2, vitaminC: 10, fiber: 6.5, fat: 7.5, carbs: 55 },
    tags: ["fiber-rich", "sweet", "quick"],
  },
  {
    id: "besan_chilla",
    name: "Savory Besan Chilla",
    mealTypes: ["breakfast", "snacks"],
    diet: "veg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "besan", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "spinach", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "cumin_seeds", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "water", amount: 0.9, unit: "cup", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Whisk besan, water, turmeric, cumin, and salt into a smooth pourable batter.", timerSeconds: null },
      { text: "Stir in finely chopped onion, tomato, and shredded spinach.", timerSeconds: null },
      { text: "Spread ladles onto a lightly oiled hot skillet and cook 2 minutes per side until crisp.", timerSeconds: 240 },
    ],
    nutritionPerServing: { calories: 245, protein: 11.5, calcium: 58, iron: 3.2, vitaminC: 16, fiber: 5.8, fat: 8.5, carbs: 30 },
    tags: ["gluten-free", "protein", "savory"],
  },
  {
    id: "bread_toast_with_egg",
    name: "Bread Toast with Spiced Egg",
    mealTypes: ["breakfast"],
    diet: "veg",
    allergens: ["egg", "gluten", "dairy"],
    cuisine: "Indian-Cafe",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 6,
    baseServings: 2,
    ingredients: [
      { ingredientId: "bread", amount: 4, unit: "slices", optional: false },
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "butter", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "black_pepper", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "coriander_leaves", amount: 1, unit: "tbsp", optional: true },
    ],
    steps: [
      { text: "Toast bread slices in butter on a hot skillet until golden and crisp.", timerSeconds: 120 },
      { text: "Fry or softly scramble the eggs with salt and cracked black pepper.", timerSeconds: 180 },
      { text: "Serve eggs piled onto warm buttered toast, garnished with coriander.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 340, protein: 17, calcium: 90, iron: 2.9, vitaminC: 2, fiber: 2, fat: 17, carbs: 28 },
    tags: ["quick", "high-protein", "eggs"],
  },
  {
    id: "chicken_keema_pav",
    name: "Chicken Keema Pav",
    mealTypes: ["breakfast", "snacks"],
    diet: "nonveg",
    allergens: ["gluten", "dairy"],
    cuisine: "Indian",
    difficulty: "medium",
    prepMinutes: 10,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_keema", amount: 280, unit: "g", optional: false },
      { ingredientId: "pav", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "butter", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Sauté onion, ginger, and garlic in oil until golden brown.", timerSeconds: 240 },
      { text: "Cook tomatoes with salt, add minced chicken, and sear 4 minutes before adding peas and garam masala.", timerSeconds: 480 },
      { text: "Toast sliced pav with butter on a skillet and serve alongside hot keema.", timerSeconds: 120 },
    ],
    nutritionPerServing: { calories: 440, protein: 31, calcium: 74, iron: 3.1, vitaminC: 14, fiber: 3.2, fat: 16, carbs: 42 },
    tags: ["high-protein", "street-style"],
  },
  {
    id: "spinach_egg_wrap",
    name: "Spinach & Scrambled Egg Wrap",
    mealTypes: ["breakfast"],
    diet: "veg",
    allergens: ["egg", "gluten", "dairy"],
    cuisine: "Fusion",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 7,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "roti_wrap", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "spinach", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "cheese", amount: 40, unit: "g", optional: true },
      { ingredientId: "butter", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "black_pepper", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Wilt spinach in butter for 1 minute, then pour in beaten eggs seasoned with salt and pepper.", timerSeconds: 150 },
      { text: "Warm the flatbread wraps, spoon spinach eggs into the center, sprinkle cheese, and roll tightly.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 365, protein: 21, calcium: 225, iron: 3.1, vitaminC: 12, fiber: 3.2, fat: 19, carbs: 26 },
    tags: ["high-protein", "quick", "eggs"],
  },

  // ======================== LUNCH (11) ========================
  {
    id: "dal_tadka",
    name: "Dal Tadka with Steamed Rice",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 25,
    baseServings: 2,
    ingredients: [
      { ingredientId: "toor_dal", amount: 0.8, unit: "cup", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "red_chilli_powder", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "ghee", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 4.5, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Simmer rinsed toor dal with turmeric, half the salt, and 2.5 cups water until creamy.", timerSeconds: 900 },
      { text: "Steam rice in 2 cups water until fluffy.", timerSeconds: 720 },
      { text: "Temper cumin seeds, garlic, onion, tomato, and chilli powder in ghee; pour over hot dal.", timerSeconds: 240 },
    ],
    nutritionPerServing: { calories: 445, protein: 15.5, calcium: 55, iron: 3.8, vitaminC: 11, fiber: 8.4, fat: 8.5, carbs: 76 },
    tags: ["comfort", "everyday", "fiber-rich"],
  },
  {
    id: "rajma_chawal",
    name: "Rajma Chawal",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: [],
    cuisine: "North Indian",
    difficulty: "medium",
    prepMinutes: 10,
    cookMinutes: 25,
    baseServings: 2,
    ingredients: [
      { ingredientId: "rajma", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 3, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Sauté onion, ginger, garlic, and cumin in oil until browned.", timerSeconds: 240 },
      { text: "Cook chopped tomatoes into a thick masala, add cooked rajma and 1 cup water, and simmer 12 minutes.", timerSeconds: 720 },
      { text: "Serve hot alongside steamed rice.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 460, protein: 16.5, calcium: 74, iron: 4.5, vitaminC: 16, fiber: 11.2, fat: 7.5, carbs: 82 },
    tags: ["high-fiber", "comfort"],
  },
  {
    id: "paneer_bhurji",
    name: "Paneer Bhurji with Roti",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: ["dairy", "gluten"],
    cuisine: "North Indian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 14,
    baseServings: 2,
    ingredients: [
      { ingredientId: "paneer", amount: 220, unit: "g", optional: false },
      { ingredientId: "roti_wrap", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "bell_pepper", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Sauté onion and bell pepper in oil until softened, then cook tomatoes with turmeric and salt.", timerSeconds: 240 },
      { text: "Fold in crumbled paneer and garam masala; toss gently for 3 minutes and serve with warm rotis.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 495, protein: 24, calcium: 365, iron: 2.9, vitaminC: 28, fiber: 5.5, fat: 23, carbs: 47 },
    tags: ["high-protein", "calcium-rich"],
  },
  {
    id: "chicken_curry",
    name: "Home-Style Chicken Curry with Rice",
    mealTypes: ["lunch", "dinner"],
    diet: "nonveg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "medium",
    prepMinutes: 15,
    cookMinutes: 30,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_curry_cut", amount: 320, unit: "g", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 6, unit: "cloves", optional: false },
      { ingredientId: "yogurt", amount: 4, unit: "tbsp", optional: true },
      { ingredientId: "coriander_powder", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 3, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Brown sliced onions in oil, then stir in ginger, garlic, tomatoes, and dry spices until rich.", timerSeconds: 360 },
      { text: "Sear chicken pieces for 5 minutes, add 1 cup water and yogurt, and simmer covered until tender.", timerSeconds: 900 },
      { text: "Steam rice in 2 cups water and serve hot with curry.", timerSeconds: 720 },
    ],
    nutritionPerServing: { calories: 560, protein: 34, calcium: 78, iron: 3.1, vitaminC: 15, fiber: 3, fat: 18, carbs: 62 },
    tags: ["high-protein", "classic"],
  },
  {
    id: "fish_curry",
    name: "Coastal Fish Curry with Rice",
    mealTypes: ["lunch", "dinner"],
    diet: "nonveg",
    allergens: [],
    cuisine: "South Indian",
    difficulty: "medium",
    prepMinutes: 12,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "fish_fillet", amount: 280, unit: "g", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "mustard_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "curry_leaves", amount: 10, unit: "leaves", optional: true },
      { ingredientId: "turmeric", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "red_chilli_powder", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 3, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Marinate fish pieces with turmeric, lemon juice, and salt for 10 minutes.", timerSeconds: 600 },
      { text: "Crackle mustard seeds and curry leaves, sauté onion and tomatoes, and simmer 1 cup water for 5 minutes.", timerSeconds: 300 },
      { text: "Poach fish gently in the simmering curry for 5 minutes and serve with steamed rice.", timerSeconds: 300 },
    ],
    nutritionPerServing: { calories: 465, protein: 30, calcium: 64, iron: 2.3, vitaminC: 21, fiber: 2.5, fat: 12, carbs: 58 },
    tags: ["omega-rich", "light"],
  },
  {
    id: "veg_pulao",
    name: "Fragrant Vegetable Pulao",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 12,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "rice", amount: 1.25, unit: "cup", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "potato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "whole_spices", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "ghee", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2.25, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Soak rinsed basmati rice 15 minutes and drain.", timerSeconds: 900 },
      { text: "Sauté whole spices, cumin, onion, and diced vegetables in ghee for 3 minutes.", timerSeconds: 180 },
      { text: "Add rice, salted water, cover tightly, and steam on low heat 12 minutes.", timerSeconds: 720 },
    ],
    nutritionPerServing: { calories: 385, protein: 8.2, calcium: 45, iron: 2.2, vitaminC: 17, fiber: 4.8, fat: 8.5, carbs: 68 },
    tags: ["one-pot", "aromatic"],
  },
  {
    id: "chole",
    name: "Chole Masala with Rice",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: [],
    cuisine: "North Indian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 20,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chickpeas", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "coriander_powder", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 3, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Sauté cumin, onion, and ginger in oil, then cook tomatoes with coriander powder and salt.", timerSeconds: 240 },
      { text: "Add cooked chickpeas, garam masala, and 1 cup water; simmer 10 minutes until thick.", timerSeconds: 600 },
      { text: "Serve alongside steamed basmati rice.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 475, protein: 15.8, calcium: 86, iron: 4.3, vitaminC: 18, fiber: 10.5, fat: 10, carbs: 80 },
    tags: ["high-fiber", "protein"],
  },
  {
    id: "lemon_rice",
    name: "South Indian Lemon Rice",
    mealTypes: ["lunch"],
    diet: "veg",
    allergens: ["nut"],
    cuisine: "South Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 14,
    baseServings: 2,
    ingredients: [
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "peanuts", amount: 3, unit: "tbsp", optional: false },
      { ingredientId: "mustard_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "curry_leaves", amount: 8, unit: "leaves", optional: true },
      { ingredientId: "green_chilli", amount: 1, unit: "pcs", optional: true },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Cook rice with water until grains are separate and fluffy, then spread to cool slightly.", timerSeconds: 720 },
      { text: "Roast peanuts in oil, crackle mustard seeds, curry leaves, green chilli, and turmeric.", timerSeconds: 120 },
      { text: "Toss rice gently with the tempering, salt, and fresh lemon juice.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 380, protein: 8.5, calcium: 32, iron: 1.8, vitaminC: 18, fiber: 2.8, fat: 14, carbs: 56 },
    tags: ["tangy", "quick", "lunchbox"],
  },
  {
    id: "chicken_fried_rice",
    name: "Garlic Chicken Fried Rice",
    mealTypes: ["lunch", "dinner"],
    diet: "nonveg",
    allergens: ["egg", "soy", "gluten"],
    cuisine: "Indo-Chinese",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 14,
    baseServings: 2,
    ingredients: [
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "chicken_breast", amount: 220, unit: "g", optional: false },
      { ingredientId: "egg", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "carrot", amount: 0.25, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "soy_sauce", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Steam rice and cool. Sear thin chicken strips with garlic and salt in hot oil.", timerSeconds: 240 },
      { text: "Push chicken aside, scramble eggs, then toss in carrots, peas, cooled rice, soy sauce, and pepper on high heat.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 475, protein: 32, calcium: 46, iron: 2.4, vitaminC: 6, fiber: 2.5, fat: 13.5, carbs: 54 },
    tags: ["wok", "high-protein"],
  },
  {
    id: "mixed_veg_sabzi",
    name: "Mixed Veg Sabzi with Roti",
    mealTypes: ["lunch", "dinner"],
    diet: "veg",
    allergens: ["gluten"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 12,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "french_beans", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "potato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "roti_wrap", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Sauté onion and tomato with turmeric and salt in oil until soft.", timerSeconds: 180 },
      { text: "Add carrot, beans, potato, and peas; cover and cook on low heat until tender.", timerSeconds: 600 },
      { text: "Finish with garam masala and serve warm with rotis.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 390, protein: 11, calcium: 62, iron: 3.1, vitaminC: 24, fiber: 8, fat: 9, carbs: 66 },
    tags: ["wholesome", "everyday"],
  },
  {
    id: "garlic_butter_prawn_rice",
    name: "Garlic Butter Prawn Rice Bowl",
    mealTypes: ["lunch"],
    diet: "nonveg",
    allergens: ["dairy"],
    cuisine: "Coastal Fusion",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 15,
    baseServings: 2,
    ingredients: [
      { ingredientId: "prawns", amount: 260, unit: "g", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "garlic", amount: 6, unit: "cloves", optional: false },
      { ingredientId: "butter", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "bell_pepper", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Steam rice in water until light and fluffy.", timerSeconds: 720 },
      { text: "Sauté garlic and bell pepper in butter, then sear prawns 3 to 4 minutes with salt and black pepper.", timerSeconds: 210 },
      { text: "Squeeze fresh lemon juice and spoon over warm rice.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 410, protein: 29, calcium: 92, iron: 2, vitaminC: 36, fiber: 1.8, fat: 8.5, carbs: 53 },
    tags: ["high-protein", "quick"],
  },

  // ======================== SNACKS (12) ========================
  {
    id: "sprouts_chaat",
    name: "Tangy Moong Sprouts Chaat",
    mealTypes: ["snacks", "breakfast"],
    diet: "veg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 0,
    baseServings: 2,
    ingredients: [
      { ingredientId: "moong_sprouts", amount: 2, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "cucumber", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "chaat_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "coriander_leaves", amount: 2, unit: "tbsp", optional: true },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Combine moong sprouts with finely diced onion, tomato, cucumber, and coriander.", timerSeconds: null },
      { text: "Toss with lemon juice, chaat masala, and salt just before serving.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 145, protein: 9.5, calcium: 40, iron: 2.2, vitaminC: 28, fiber: 6.5, fat: 1.2, carbs: 24 },
    tags: ["no-cook", "high-fiber", "fresh"],
  },
  {
    id: "roasted_chana",
    name: "Spiced Roasted Chana Bowl",
    mealTypes: ["snacks"],
    diet: "veg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 0,
    baseServings: 2,
    ingredients: [
      { ingredientId: "roasted_chana", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "chaat_masala", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "coriander_leaves", amount: 2, unit: "tbsp", optional: true },
      { ingredientId: "salt", amount: 0.25, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Toss crunchy roasted chana with finely chopped onion, tomato, and coriander.", timerSeconds: null },
      { text: "Sprinkle chaat masala, salt, and fresh lemon juice and eat immediately while crisp.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 210, protein: 11, calcium: 48, iron: 3.1, vitaminC: 11, fiber: 7.5, fat: 3.5, carbs: 34 },
    tags: ["crunchy", "no-cook", "protein"],
  },
  {
    id: "boiled_egg_sandwich",
    name: "Boiled Egg Pepper Sandwich",
    mealTypes: ["snacks", "breakfast"],
    diet: "veg",
    allergens: ["egg", "gluten", "dairy"],
    cuisine: "International",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "bread", amount: 4, unit: "slices", optional: false },
      { ingredientId: "yogurt", amount: 2, unit: "tbsp", optional: false },
      { ingredientId: "cucumber", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "butter", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "black_pepper", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Hard-boil eggs for 9 minutes, cool, peel, and chop roughly.", timerSeconds: 540 },
      { text: "Mix chopped eggs with yogurt, black pepper, salt, and diced cucumber.", timerSeconds: null },
      { text: "Spread butter lightly on bread, add egg salad, and slice diagonally.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 335, protein: 18, calcium: 115, iron: 2.8, vitaminC: 3, fiber: 2.2, fat: 15, carbs: 30 },
    tags: ["high-protein", "eggs", "lunchbox"],
  },
  {
    id: "chicken_tikka",
    name: "Skillet Chicken Tikka Bites",
    mealTypes: ["snacks", "dinner"],
    diet: "nonveg",
    allergens: ["dairy"],
    cuisine: "North Indian",
    difficulty: "easy",
    prepMinutes: 15,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_breast", amount: 280, unit: "g", optional: false },
      { ingredientId: "yogurt", amount: 4, unit: "tbsp", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 3, unit: "cloves", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "red_chilli_powder", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Marinate chicken cubes in yogurt, ginger, garlic, spices, lemon, and salt for 10 minutes.", timerSeconds: 600 },
      { text: "Pan-sear over medium-high oil for 5 minutes per side until charred and juicy.", timerSeconds: 600 },
    ],
    nutritionPerServing: { calories: 255, protein: 33, calcium: 68, iron: 1.8, vitaminC: 9, fiber: 0.6, fat: 10.5, carbs: 5 },
    tags: ["high-protein", "smoky"],
  },
  {
    id: "corn_chaat",
    name: "Masala Sweet Corn Chaat",
    mealTypes: ["snacks"],
    diet: "veg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 5,
    cookMinutes: 6,
    baseServings: 2,
    ingredients: [
      { ingredientId: "sweet_corn", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "butter", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "chaat_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Boil or steam sweet corn kernels for 4 minutes until plump, then drain.", timerSeconds: 240 },
      { text: "Toss warm corn with butter, onion, tomato, chaat masala, salt, and lemon juice.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 175, protein: 4.5, calcium: 15, iron: 1, vitaminC: 16, fiber: 3.4, fat: 5.5, carbs: 28 },
    tags: ["quick", "street-style"],
  },
  {
    id: "peanut_chikki",
    name: "Homemade Peanut Jaggery Chikki",
    mealTypes: ["snacks"],
    diet: "veg",
    allergens: ["nut"],
    cuisine: "Indian",
    difficulty: "medium",
    prepMinutes: 5,
    cookMinutes: 10,
    baseServings: 4,
    ingredients: [
      { ingredientId: "peanuts", amount: 1, unit: "cup", optional: false },
      { ingredientId: "jaggery", amount: 0.75, unit: "cup", optional: false },
      { ingredientId: "ghee", amount: 1, unit: "tsp", optional: true },
      { ingredientId: "water", amount: 2, unit: "tbsp", optional: false },
    ],
    steps: [
      { text: "Dry roast peanuts until crisp, rub off skins, and crush coarsely.", timerSeconds: 240 },
      { text: "Melt jaggery with water and simmer until a drop in cold water snaps crisply.", timerSeconds: 300 },
      { text: "Stir in peanuts quickly, spread thin on a greased board, score into squares, and cool.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 255, protein: 7.5, calcium: 42, iron: 2.4, vitaminC: 0, fiber: 2.8, fat: 14, carbs: 27 },
    tags: ["sweet", "crunchy", "iron-rich"],
  },
  {
    id: "fruit_chaat",
    name: "Spiced Fresh Fruit Chaat",
    mealTypes: ["snacks", "breakfast"],
    diet: "veg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 0,
    baseServings: 2,
    ingredients: [
      { ingredientId: "apple", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "banana", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "papaya", amount: 1, unit: "cup", optional: false },
      { ingredientId: "pomegranate", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "chaat_masala", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "mint_leaves", amount: 1, unit: "tbsp", optional: true },
    ],
    steps: [
      { text: "Cube apple, banana, and papaya cleanly into a chilled bowl.", timerSeconds: null },
      { text: "Toss gently with pomegranate, lemon juice, chaat masala, and chopped mint.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 140, protein: 2, calcium: 32, iron: 0.8, vitaminC: 58, fiber: 4.5, fat: 0.6, carbs: 34 },
    tags: ["no-cook", "vitamin-c", "fresh"],
  },
  {
    id: "vegetable_cutlet",
    name: "Crispy Mixed Vegetable Cutlet",
    mealTypes: ["snacks"],
    diet: "veg",
    allergens: ["gluten"],
    cuisine: "Indian",
    difficulty: "medium",
    prepMinutes: 15,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "potato", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: false },
      { ingredientId: "bread", amount: 2, unit: "slices", optional: false },
      { ingredientId: "garam_masala", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 2, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Mash boiled potatoes with steamed carrots, peas, crumbled bread, garam masala, and salt.", timerSeconds: null },
      { text: "Shape into flat oval patties and pan-fry in oil for 4 minutes per side until golden crisp.", timerSeconds: 480 },
    ],
    nutritionPerServing: { calories: 295, protein: 7, calcium: 42, iron: 2.3, vitaminC: 22, fiber: 5.2, fat: 11, carbs: 43 },
    tags: ["crispy", "tea-time"],
  },
  {
    id: "egg_kathi_roll",
    name: "Street-Style Egg Kathi Roll",
    mealTypes: ["snacks", "lunch"],
    diet: "veg",
    allergens: ["egg", "gluten"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 6,
    cookMinutes: 8,
    baseServings: 2,
    ingredients: [
      { ingredientId: "roti_wrap", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "chaat_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Pour whisked salted eggs on an oiled pan and press flatbread on top until egg cooks onto it.", timerSeconds: 150 },
      { text: "Top with sliced onions, chaat masala, and lemon juice; roll tightly.", timerSeconds: null },
    ],
    nutritionPerServing: { calories: 345, protein: 16, calcium: 72, iron: 2.6, vitaminC: 9, fiber: 2.8, fat: 16, carbs: 32 },
    tags: ["street-style", "eggs", "quick"],
  },
  {
    id: "egg_pepper_fry",
    name: "South Indian Egg Pepper Fry",
    mealTypes: ["snacks"],
    diet: "veg",
    allergens: ["egg"],
    cuisine: "South Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "curry_leaves", amount: 8, unit: "leaves", optional: true },
      { ingredientId: "black_pepper", amount: 1.5, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Hard-boil eggs 9 minutes, peel, and slice in half.", timerSeconds: 540 },
      { text: "Sauté onion and curry leaves in oil, toss in turmeric, black pepper, salt, and sear egg halves 2 minutes.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 225, protein: 13.5, calcium: 56, iron: 2, vitaminC: 5, fiber: 1.2, fat: 16, carbs: 6 },
    tags: ["high-protein", "eggs", "spicy"],
  },
  {
    id: "chicken_keema_toasties",
    name: "Spiced Chicken Keema Toasties",
    mealTypes: ["snacks"],
    diet: "nonveg",
    allergens: ["gluten", "dairy"],
    cuisine: "Indian-Cafe",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_keema", amount: 180, unit: "g", optional: false },
      { ingredientId: "bread", amount: 4, unit: "slices", optional: false },
      { ingredientId: "cheese", amount: 50, unit: "g", optional: true },
      { ingredientId: "onion", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "garam_masala", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "butter", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Brown onion and minced chicken in butter with garam masala and salt until cooked through.", timerSeconds: 360 },
      { text: "Spoon onto toasted bread, top with cheese, and cover 2 minutes until melted.", timerSeconds: 120 },
    ],
    nutritionPerServing: { calories: 385, protein: 28, calcium: 195, iron: 2.4, vitaminC: 3, fiber: 1.8, fat: 18, carbs: 26 },
    tags: ["high-protein", "savory"],
  },
  {
    id: "crispy_chicken_bites",
    name: "Garlic Pepper Chicken Bites",
    mealTypes: ["snacks"],
    diet: "nonveg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_breast", amount: 260, unit: "g", optional: false },
      { ingredientId: "besan", amount: 3, unit: "tbsp", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Coat chicken cubes with garlic, pepper, lemon juice, salt, and besan.", timerSeconds: null },
      { text: "Pan-sear in hot oil 4 minutes per side until crisp and golden.", timerSeconds: 480 },
    ],
    nutritionPerServing: { calories: 255, protein: 32, calcium: 24, iron: 1.8, vitaminC: 9, fiber: 1.5, fat: 9.5, carbs: 9 },
    tags: ["high-protein", "crispy"],
  },

  // ======================== DINNER (11) ========================
  {
    id: "palak_paneer",
    name: "Palak Paneer with Roti",
    mealTypes: ["dinner", "lunch"],
    diet: "veg",
    allergens: ["dairy", "gluten"],
    cuisine: "North Indian",
    difficulty: "medium",
    prepMinutes: 12,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "spinach", amount: 3, unit: "cup", optional: false },
      { ingredientId: "paneer", amount: 200, unit: "g", optional: false },
      { ingredientId: "roti_wrap", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "ghee", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Blanch spinach 2 minutes, drain, and blend into a smooth emerald puree.", timerSeconds: 120 },
      { text: "Sauté onion, garlic, and tomato in ghee, stir in spinach puree and garam masala, and simmer 4 minutes.", timerSeconds: 240 },
      { text: "Fold in paneer cubes for 2 minutes and serve with warm rotis.", timerSeconds: 120 },
    ],
    nutritionPerServing: { calories: 475, protein: 23, calcium: 410, iron: 4.9, vitaminC: 24, fiber: 6.8, fat: 22, carbs: 46 },
    tags: ["iron-rich", "calcium-rich"],
  },
  {
    id: "egg_curry",
    name: "Spiced Egg Curry with Rice",
    mealTypes: ["dinner", "lunch"],
    diet: "veg",
    allergens: ["egg"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 20,
    baseServings: 2,
    ingredients: [
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 3, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Hard-boil eggs 9 minutes, peel, and prick lightly.", timerSeconds: 540 },
      { text: "Cook rice in 2 cups water. Sauté onion, ginger, garlic, and tomatoes into a rich base.", timerSeconds: 720 },
      { text: "Add 1 cup water, garam masala, and boiled eggs; simmer 5 minutes.", timerSeconds: 300 },
    ],
    nutritionPerServing: { calories: 445, protein: 17.5, calcium: 74, iron: 3.1, vitaminC: 14, fiber: 2.8, fat: 16.5, carbs: 56 },
    tags: ["high-protein", "eggs", "comfort"],
  },
  {
    id: "mutton_stew",
    name: "Spiced Mutton & Vegetable Stew",
    mealTypes: ["dinner"],
    diet: "nonveg",
    allergens: [],
    cuisine: "Indian",
    difficulty: "hard",
    prepMinutes: 15,
    cookMinutes: 40,
    baseServings: 2,
    ingredients: [
      { ingredientId: "mutton", amount: 320, unit: "g", optional: false },
      { ingredientId: "potato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 1.5, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 5, unit: "cloves", optional: false },
      { ingredientId: "whole_spices", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.25, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2.5, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Sear mutton with whole spices, onion, ginger, and garlic in oil for 6 minutes.", timerSeconds: 360 },
      { text: "Pour in salted water, cover, and braise on low heat 25 minutes until tender.", timerSeconds: 1500 },
      { text: "Add potato, carrot, and black pepper; simmer 10 minutes more until vegetables are soft.", timerSeconds: 600 },
    ],
    nutritionPerServing: { calories: 490, protein: 35, calcium: 48, iron: 4.4, vitaminC: 14, fiber: 3.5, fat: 26, carbs: 26 },
    tags: ["slow-cooked", "hearty"],
  },
  {
    id: "chicken_stir_fry",
    name: "Garlic Soy Chicken Stir-Fry",
    mealTypes: ["dinner"],
    diet: "nonveg",
    allergens: ["soy", "gluten"],
    cuisine: "Asian",
    difficulty: "easy",
    prepMinutes: 10,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_breast", amount: 280, unit: "g", optional: false },
      { ingredientId: "broccoli", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "bell_pepper", amount: 1, unit: "cup", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "ginger", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "soy_sauce", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "black_pepper", amount: 0.75, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
    ],
    steps: [
      { text: "Stir-fry chicken strips in hot oil with garlic and ginger for 4 minutes.", timerSeconds: 240 },
      { text: "Add broccoli, bell pepper, and carrot; toss on high heat 3 minutes.", timerSeconds: 180 },
      { text: "Splash in soy sauce and black pepper and toss 1 minute until glossy.", timerSeconds: 60 },
    ],
    nutritionPerServing: { calories: 315, protein: 36, calcium: 62, iron: 2.2, vitaminC: 92, fiber: 4.8, fat: 11, carbs: 16 },
    tags: ["high-protein", "low-carb", "quick"],
  },
  {
    id: "aloo_gobi",
    name: "Aloo Gobi Masala with Roti",
    mealTypes: ["dinner", "lunch"],
    diet: "veg",
    allergens: ["gluten"],
    cuisine: "North Indian",
    difficulty: "easy",
    prepMinutes: 12,
    cookMinutes: 18,
    baseServings: 2,
    ingredients: [
      { ingredientId: "cauliflower", amount: 2, unit: "cup", optional: false },
      { ingredientId: "potato", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "roti_wrap", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Crackle cumin seeds in oil and sauté onion 2 minutes.", timerSeconds: 120 },
      { text: "Add potatoes, cauliflower florets, turmeric, and salt; cook covered 10 minutes.", timerSeconds: 600 },
      { text: "Fold in chopped tomatoes and garam masala; cook uncovered 4 minutes and serve with rotis.", timerSeconds: 240 },
    ],
    nutritionPerServing: { calories: 415, protein: 11.5, calcium: 62, iron: 3.1, vitaminC: 62, fiber: 7.5, fat: 10.5, carbs: 70 },
    tags: ["classic", "vitamin-c"],
  },
  {
    id: "vegetable_khichdi",
    name: "Comforting Vegetable Moong Khichdi",
    mealTypes: ["dinner", "lunch"],
    diet: "veg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 20,
    baseServings: 2,
    ingredients: [
      { ingredientId: "moong_dal", amount: 0.7, unit: "cup", optional: false },
      { ingredientId: "rice", amount: 0.7, unit: "cup", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "cumin_seeds", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "ghee", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 4, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Wash moong dal and rice together until water runs clear.", timerSeconds: null },
      { text: "Crackle cumin in ghee, sauté carrots and peas, then add dal, rice, turmeric, salt, and water.", timerSeconds: 120 },
      { text: "Cover and simmer gently 15 minutes until creamy and comforting.", timerSeconds: 900 },
    ],
    nutritionPerServing: { calories: 370, protein: 14, calcium: 48, iron: 3.1, vitaminC: 8, fiber: 6.2, fat: 7.5, carbs: 62 },
    tags: ["one-pot", "comfort", "light"],
  },
  {
    id: "paneer_tikka",
    name: "Charred Paneer Tikka",
    mealTypes: ["dinner", "snacks"],
    diet: "veg",
    allergens: ["dairy"],
    cuisine: "North Indian",
    difficulty: "easy",
    prepMinutes: 15,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "paneer", amount: 220, unit: "g", optional: false },
      { ingredientId: "yogurt", amount: 4, unit: "tbsp", optional: false },
      { ingredientId: "bell_pepper", amount: 0.75, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "turmeric", amount: 0.5, unit: "tsp", optional: false },
      { ingredientId: "chaat_masala", amount: 0.5, unit: "tsp", optional: true },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Marinate paneer cubes, bell pepper, and onion petals in spiced yogurt for 10 minutes.", timerSeconds: 600 },
      { text: "Pan-sear over hot oil 6 minutes until charred golden spots form; dust with chaat masala and lemon.", timerSeconds: 360 },
    ],
    nutritionPerServing: { calories: 345, protein: 21, calcium: 360, iron: 1.5, vitaminC: 35, fiber: 2, fat: 25, carbs: 9 },
    tags: ["high-protein", "calcium-rich"],
  },
  {
    id: "egg_fried_rice",
    name: "Garlic Egg Fried Rice",
    mealTypes: ["dinner", "lunch"],
    diet: "veg",
    allergens: ["egg", "soy", "gluten"],
    cuisine: "Indo-Chinese",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 10,
    baseServings: 2,
    ingredients: [
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "egg", amount: 4, unit: "pcs", optional: false },
      { ingredientId: "cabbage", amount: 0.75, unit: "cup", optional: false },
      { ingredientId: "green_peas", amount: 0.25, unit: "cup", optional: true },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "soy_sauce", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 0.5, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Scramble beaten eggs softly in hot oiled wok, then stir-fry garlic, cabbage, and peas 2 minutes.", timerSeconds: 120 },
      { text: "Add cooked rice, soy sauce, pepper, and salt; toss vigorously 3 minutes on high heat.", timerSeconds: 180 },
    ],
    nutritionPerServing: { calories: 410, protein: 16.5, calcium: 76, iron: 2.6, vitaminC: 15, fiber: 2.9, fat: 16, carbs: 49 },
    tags: ["wok", "eggs", "quick"],
  },
  {
    id: "chicken_biryani",
    name: "Aromatic Home Chicken Biryani",
    mealTypes: ["dinner", "lunch"],
    diet: "nonveg",
    allergens: ["dairy"],
    cuisine: "Indian",
    difficulty: "hard",
    prepMinutes: 20,
    cookMinutes: 35,
    baseServings: 2,
    ingredients: [
      { ingredientId: "chicken_curry_cut", amount: 320, unit: "g", optional: false },
      { ingredientId: "rice", amount: 1.25, unit: "cup", optional: false },
      { ingredientId: "yogurt", amount: 0.5, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 2, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "ginger", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "garlic", amount: 5, unit: "cloves", optional: false },
      { ingredientId: "whole_spices", amount: 2, unit: "tsp", optional: false },
      { ingredientId: "mint_leaves", amount: 2, unit: "tbsp", optional: true },
      { ingredientId: "ghee", amount: 1.5, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1.5, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2.5, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Marinate chicken in yogurt, ginger, garlic, half the salt, and mint for 15 minutes.", timerSeconds: 900 },
      { text: "Fry sliced onions in ghee until golden brown; cook chicken and tomato 10 minutes.", timerSeconds: 600 },
      { text: "Parboil basmati rice with whole spices, layer over chicken, cover tightly, and steam 15 minutes on low.", timerSeconds: 900 },
    ],
    nutritionPerServing: { calories: 595, protein: 35, calcium: 115, iron: 3.3, vitaminC: 12, fiber: 3, fat: 20, carbs: 67 },
    tags: ["festive", "aromatic"],
  },
  {
    id: "prawn_masala",
    name: "Pepper Prawn Masala with Rice",
    mealTypes: ["dinner"],
    diet: "nonveg",
    allergens: [],
    cuisine: "Coastal Indian",
    difficulty: "medium",
    prepMinutes: 12,
    cookMinutes: 16,
    baseServings: 2,
    ingredients: [
      { ingredientId: "prawns", amount: 280, unit: "g", optional: false },
      { ingredientId: "rice", amount: 1, unit: "cup", optional: false },
      { ingredientId: "onion", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "tomato", amount: 1.5, unit: "pcs", optional: false },
      { ingredientId: "garlic", amount: 5, unit: "cloves", optional: false },
      { ingredientId: "curry_leaves", amount: 8, unit: "leaves", optional: true },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "garam_masala", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "oil", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "salt", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "water", amount: 2, unit: "cup", optional: false },
    ],
    steps: [
      { text: "Steam rice in water until fluffy. Sauté onion, garlic, and curry leaves until browned.", timerSeconds: 720 },
      { text: "Cook tomatoes with black pepper and salt, fold in prawns and garam masala, and simmer 4 minutes.", timerSeconds: 240 },
    ],
    nutritionPerServing: { calories: 405, protein: 30, calcium: 96, iron: 2.3, vitaminC: 16, fiber: 2.4, fat: 8, carbs: 53 },
    tags: ["high-protein", "coastal"],
  },
  {
    id: "herb_seared_fish",
    name: "Pan-Seared Herb Fish & Broccoli",
    mealTypes: ["dinner"],
    diet: "nonveg",
    allergens: ["dairy"],
    cuisine: "International",
    difficulty: "easy",
    prepMinutes: 8,
    cookMinutes: 12,
    baseServings: 2,
    ingredients: [
      { ingredientId: "fish_fillet", amount: 320, unit: "g", optional: false },
      { ingredientId: "broccoli", amount: 1.5, unit: "cup", optional: false },
      { ingredientId: "carrot", amount: 0.5, unit: "cup", optional: true },
      { ingredientId: "garlic", amount: 4, unit: "cloves", optional: false },
      { ingredientId: "lemon", amount: 1, unit: "pcs", optional: false },
      { ingredientId: "butter", amount: 1, unit: "tbsp", optional: false },
      { ingredientId: "black_pepper", amount: 1, unit: "tsp", optional: false },
      { ingredientId: "salt", amount: 0.75, unit: "tsp", optional: false },
    ],
    steps: [
      { text: "Sauté broccoli and carrots in half the butter for 4 minutes until crisp-tender.", timerSeconds: 240 },
      { text: "Sear seasoned fish fillets in remaining butter and garlic 3 minutes per side; finish with lemon.", timerSeconds: 360 },
    ],
    nutritionPerServing: { calories: 295, protein: 32, calcium: 74, iron: 1.8, vitaminC: 68, fiber: 4, fat: 12, carbs: 14 },
    tags: ["low-carb", "high-protein", "quick"],
  },
];

export const RECIPE_VISUALS = {
  poha: { color: "#FFF1DC", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/poha.jpg" },
  upma: { color: "#E9A23B", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/upma.jpg" },
  masala_omelette: { color: "#FFF1DC", accent: "#E9A23B", icon: "pan", photoPath: "/photos/masala_omelette.jpg" },
  idli: { color: "#FFF1DC", accent: "#2E8B57", icon: "plate", photoPath: "/photos/idli.jpg" },
  dosa: { color: "#E9A23B", accent: "#2E8B57", icon: "pan", photoPath: "/photos/dosa.jpg" },
  paratha: { color: "#FFF1DC", accent: "#2E8B57", icon: "plate", photoPath: "/photos/paratha.jpg" },
  egg_bhurji: { color: "#2E8B57", accent: "#E9A23B", icon: "pan", photoPath: "/photos/egg_bhurji.jpg" },
  oats_porridge: { color: "#E9A23B", accent: "#2E8B57", icon: "cup", photoPath: "/photos/oats_porridge.jpg" },
  besan_chilla: { color: "#FFF1DC", accent: "#2E8B57", icon: "pan", photoPath: "/photos/besan_chilla.jpg" },
  bread_toast_with_egg: { color: "#FFF1DC", accent: "#E9A23B", icon: "plate", photoPath: "/photos/bread_toast_with_egg.jpg" },
  chicken_keema_pav: { color: "#FFF1DC", accent: "#E4572E", icon: "plate", photoPath: "/photos/chicken_keema_pav.jpg" },
  spinach_egg_wrap: { color: "#2E8B57", accent: "#E9A23B", icon: "wrap", photoPath: "/photos/spinach_egg_wrap.jpg" },
  dal_tadka: { color: "#E9A23B", accent: "#2E8B57", icon: "pot", photoPath: "/photos/dal_tadka.jpg" },
  rajma_chawal: { color: "#FFF1DC", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/rajma_chawal.jpg" },
  paneer_bhurji: { color: "#E9A23B", accent: "#2E8B57", icon: "pan", photoPath: "/photos/paneer_bhurji.jpg" },
  chicken_curry: { color: "#E9A23B", accent: "#6B3E26", icon: "pot", photoPath: "/photos/chicken_curry.jpg" },
  fish_curry: { color: "#FFF1DC", accent: "#E4572E", icon: "pot", photoPath: "/photos/fish_curry.jpg" },
  veg_pulao: { color: "#FFF1DC", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/veg_pulao.jpg" },
  chole: { color: "#E9A23B", accent: "#2E8B57", icon: "pot", photoPath: "/photos/chole.jpg" },
  lemon_rice: { color: "#E9A23B", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/lemon_rice.jpg" },
  chicken_fried_rice: { color: "#E9A23B", accent: "#6B3E26", icon: "bowl", photoPath: "/photos/chicken_fried_rice.jpg" },
  mixed_veg_sabzi: { color: "#FFF1DC", accent: "#2E8B57", icon: "pan", photoPath: "/photos/mixed_veg_sabzi.jpg" },
  boiled_egg_sandwich: { color: "#FFF1DC", accent: "#E9A23B", icon: "wrap", photoPath: "/photos/boiled_egg_sandwich.jpg" },
  garlic_butter_prawn_rice: { color: "#FFF1DC", accent: "#E4572E", icon: "bowl", photoPath: "/photos/garlic_butter_prawn_rice.jpg" },
  sprouts_chaat: { color: "#FFF1DC", accent: "#2E8B57", icon: "leaf", photoPath: "/photos/sprouts_chaat.jpg" },
  roasted_chana: { color: "#E9A23B", accent: "#2E8B57", icon: "cup", photoPath: "/photos/roasted_chana.jpg" },
  corn_chaat: { color: "#FFF1DC", accent: "#2E8B57", icon: "cup", photoPath: "/photos/corn_chaat.jpg" },
  peanut_chikki: { color: "#E9A23B", accent: "#2E8B57", icon: "plate", photoPath: "/photos/peanut_chikki.jpg" },
  chicken_tikka: { color: "#E9A23B", accent: "#6B3E26", icon: "skewer", photoPath: "/photos/chicken_tikka.jpg" },
  fruit_chaat: { color: "#FFF1DC", accent: "#2E8B57", icon: "leaf", photoPath: "/photos/fruit_chaat.jpg" },
  egg_kathi_roll: { color: "#2E8B57", accent: "#E9A23B", icon: "wrap", photoPath: "/photos/egg_kathi_roll.jpg" },
  vegetable_cutlet: { color: "#E9A23B", accent: "#2E8B57", icon: "pan", photoPath: "/photos/vegetable_cutlet.jpg" },
  chicken_keema_toasties: { color: "#FFF1DC", accent: "#E4572E", icon: "wrap", photoPath: "/photos/chicken_keema_toasties.jpg" },
  crispy_chicken_bites: { color: "#E9A23B", accent: "#6B3E26", icon: "skewer", photoPath: "/photos/crispy_chicken_bites.jpg" },
  palak_paneer: { color: "#FFF1DC", accent: "#2E8B57", icon: "leaf", photoPath: "/photos/palak_paneer.jpg" },
  aloo_gobi: { color: "#E9A23B", accent: "#2E8B57", icon: "pot", photoPath: "/photos/aloo_gobi.jpg" },
  mutton_stew: { color: "#FFF1DC", accent: "#6B3E26", icon: "pot", photoPath: "/photos/mutton_stew.jpg" },
  chicken_stir_fry: { color: "#E9A23B", accent: "#E4572E", icon: "pan", photoPath: "/photos/chicken_stir_fry.jpg" },
  egg_pepper_fry: { color: "#FFF1DC", accent: "#E9A23B", icon: "pan", photoPath: "/photos/egg_pepper_fry.jpg" },
  vegetable_khichdi: { color: "#FFF1DC", accent: "#2E8B57", icon: "bowl", photoPath: "/photos/vegetable_khichdi.jpg" },
  egg_curry: { color: "#2E8B57", accent: "#E9A23B", icon: "pot", photoPath: "/photos/egg_curry.jpg" },
  chicken_biryani: { color: "#FFF1DC", accent: "#6B3E26", icon: "pot", photoPath: "/photos/chicken_biryani.jpg" },
  paneer_tikka: { color: "#E9A23B", accent: "#2E8B57", icon: "skewer", photoPath: "/photos/paneer_tikka.jpg" },
  prawn_masala: { color: "#E9A23B", accent: "#E4572E", icon: "pan", photoPath: "/photos/prawn_masala.jpg" },
  egg_fried_rice: { color: "#FFF1DC", accent: "#E9A23B", icon: "bowl", photoPath: "/photos/egg_fried_rice.jpg" },
  herb_seared_fish: { color: "#FFF1DC", accent: "#E4572E", icon: "plate", photoPath: "/photos/herb_seared_fish.jpg" },
};

const INGREDIENTS_BY_ID = new Map(INGREDIENTS.map((ing) => [ing.id, ing]));

function computeHouseholdMultiplier(household = {}) {
  const adults = Math.max(1, Number(household.adults) || 1);
  const children = Array.isArray(household.children) ? household.children : [];
  const childWeights = { toddler: 0.5, child: 0.75, teen: 1 };
  const childSum = children.reduce(
    (sum, c) => sum + (childWeights[c?.ageGroup] ?? 0.75),
    0
  );
  return Math.round((adults * 1 + childSum) * 100) / 100;
}

/**
 * Look up a single ingredient definition by its unique snake_case id.
 * @param {string} id
 * @returns {object|null}
 */
export function getIngredientById(id) {
  return INGREDIENTS_BY_ID.get(id) ?? null;
}

/**
 * Evaluate a recipe against a user's selected main (non-staple) ingredients.
 * Pantry staples (assumedAvailable: true) are assumed on hand and excluded from
 * the coverage denominator, numerator, and missing items list.
 * Optional items never reduce coverage.
 *
 * @param {object} recipe
 * @param {Set<string>} ownedMainSet
 * @param {{ diet?: "veg"|"nonveg", allergySet?: Set<string> }} [options]
 * @returns {object|null} Scored RecipeMatch metadata, or null if incompatible/unmatched
 */
export function evaluateRecipeMatch(recipe, ownedMainSet, { diet = "veg", allergySet = new Set() } = {}) {
  if (!recipe || typeof recipe !== "object") return null;
  if (diet === "veg" && recipe.diet !== "veg") return null;
  if (Array.isArray(recipe.allergens) && recipe.allergens.some((a) => allergySet.has(a))) {
    return null;
  }

  const haveIngredients = [];
  const missingIngredients = [];
  const usedSelectedIngredients = [];
  const requiredMainIds = [];
  const allMainIds = [];

  let requiredNonStapleTotal = 0;
  let requiredNonStapleOwned = 0;
  let matchedAnyMainCount = 0;

  for (const item of Array.isArray(recipe.ingredients) ? recipe.ingredients : []) {
    const ing = getIngredientById(item.ingredientId);
    if (diet === "veg" && ing && !ing.isVeg) return null;
    if (ing && Array.isArray(ing.allergens) && ing.allergens.some((a) => allergySet.has(a))) {
      return null;
    }

    const isStaple = Boolean(ing?.assumedAvailable);
    const isOptional = Boolean(item.optional);

    if (isStaple) {
      // Pantry staples count as on hand for cooking/grocery checks, never missing or scored.
      haveIngredients.push(item);
      continue;
    }

    allMainIds.push(item.ingredientId);
    if (!isOptional) {
      requiredMainIds.push(item.ingredientId);
    }

    const userHasMain = ownedMainSet.has(item.ingredientId);
    if (userHasMain) {
      haveIngredients.push(item);
      usedSelectedIngredients.push(item);
      matchedAnyMainCount += 1;
    } else if (!isOptional) {
      missingIngredients.push(item);
    }

    if (!isOptional) {
      requiredNonStapleTotal += 1;
      if (userHasMain) {
        requiredNonStapleOwned += 1;
      }
    }
  }

  const coverage =
    requiredNonStapleTotal === 0
      ? 1
      : requiredNonStapleOwned / requiredNonStapleTotal;
  const matchScore = Math.round(coverage * 100);
  const missingRequiredCount = missingIngredients.length;
  const usedSelectedCount = usedSelectedIngredients.length;
  const hasSelectedMainMatch =
    requiredNonStapleTotal > 0 ? requiredNonStapleOwned >= 1 : matchedAnyMainCount >= 1;

  const keyIds = requiredMainIds.length > 0 ? requiredMainIds : allMainIds;
  const mainIngredientSetKey = Array.from(new Set(keyIds)).sort().join("|");

  return {
    ...recipe,
    matchScore,
    coverage,
    missingRequiredCount,
    usedSelectedCount,
    usedSelectedIngredients,
    mainIngredientSetKey,
    isClosestMatch: false,
    missingIngredients,
    haveIngredients,
    hasSelectedMainMatch,
  };
}

/**
 * Compare two RecipeMatch objects by:
 * 1) coverage descending
 * 2) number of missing required non-staple items ascending
 * 3) number of user's selected main ingredients used descending
 * 4) total time ascending
 */
export function compareRecipeMatches(a, b) {
  const covA =
    typeof a?.coverage === "number" ? a.coverage : (Number(a?.matchScore) || 0) / 100;
  const covB =
    typeof b?.coverage === "number" ? b.coverage : (Number(b?.matchScore) || 0) / 100;
  if (Math.abs(covB - covA) > 1e-9) {
    return covB - covA;
  }

  const missA =
    typeof a?.missingRequiredCount === "number"
      ? a.missingRequiredCount
      : Array.isArray(a?.missingIngredients)
      ? a.missingIngredients.length
      : 0;
  const missB =
    typeof b?.missingRequiredCount === "number"
      ? b.missingRequiredCount
      : Array.isArray(b?.missingIngredients)
      ? b.missingIngredients.length
      : 0;
  if (missA !== missB) {
    return missA - missB;
  }

  const usedA =
    typeof a?.usedSelectedCount === "number"
      ? a.usedSelectedCount
      : Array.isArray(a?.usedSelectedIngredients)
      ? a.usedSelectedIngredients.length
      : 0;
  const usedB =
    typeof b?.usedSelectedCount === "number"
      ? b.usedSelectedCount
      : Array.isArray(b?.usedSelectedIngredients)
      ? b.usedSelectedIngredients.length
      : 0;
  if (usedB !== usedA) {
    return usedB - usedA;
  }

  const timeA = (Number(a?.prepMinutes) || 0) + (Number(a?.cookMinutes) || 0);
  const timeB = (Number(b?.prepMinutes) || 0) + (Number(b?.cookMinutes) || 0);
  if (timeA !== timeB) {
    return timeA - timeB;
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

/**
 * Avoid showing more than `maxPerSet` recipes that share the exact same required main
 * ingredient set near the top of results by keeping the best-sorted ones in order and
 * moving distinct recipes up ahead of 3rd+ duplicates.
 *
 * @param {Array<object>} sortedRecipes
 * @param {number} [maxPerSet=2]
 * @returns {Array<object>}
 */
export function diversifyMatchedRecipes(sortedRecipes, maxPerSet = 2) {
  if (!Array.isArray(sortedRecipes) || sortedRecipes.length <= 2) {
    return Array.isArray(sortedRecipes) ? [...sortedRecipes] : [];
  }

  const counts = new Map();
  const prioritized = [];
  const deferred = [];

  for (const recipe of sortedRecipes) {
    let key = recipe?.mainIngredientSetKey;
    if (typeof key !== "string" || key.length === 0) {
      const ids = (Array.isArray(recipe?.ingredients) ? recipe.ingredients : [])
        .filter((i) => !i?.optional && !getIngredientById(i?.ingredientId)?.assumedAvailable)
        .map((i) => i.ingredientId);
      key = Array.from(new Set(ids)).sort().join("|") || String(recipe?.id || "");
    }
    const seen = counts.get(key) ?? 0;
    if (seen < maxPerSet) {
      counts.set(key, seen + 1);
      prioritized.push(recipe);
    } else {
      deferred.push(recipe);
    }
  }

  return [...prioritized, ...deferred];
}

/**
 * Randomly reorder equal-scoring recipes (same matchScore tier) while preserving
 * overall ranking across distinct score tiers.
 *
 * @param {Array<object>} recipes
 * @returns {Array<object>}
 */
export function shuffleEqualScoringRecipes(recipes) {
  if (!Array.isArray(recipes) || recipes.length <= 1) {
    return Array.isArray(recipes) ? [...recipes] : [];
  }

  const output = [];
  let idx = 0;

  while (idx < recipes.length) {
    const bucketScore = recipes[idx]?.matchScore;
    let end = idx + 1;
    while (end < recipes.length && recipes[end]?.matchScore === bucketScore) {
      end += 1;
    }

    const group = recipes.slice(idx, end);
    if (group.length > 1) {
      const beforeIds = group.map((g) => g.id).join(",");
      for (let attempt = 0; attempt < 4; attempt += 1) {
        for (let i = group.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [group[i], group[j]] = [group[j], group[i]];
        }
        if (group.map((g) => g.id).join(",") !== beforeIds) break;
      }
    }
    output.push(...group);
    idx = end;
  }

  return output;
}

/**
 * Filter and score recipes based on diet, meal type, allergies, and selected main ingredients.
 * - Excludes pantry staples (assumedAvailable: true) from denominator & missing list.
 * - Requires at least one selected main (non-staple) ingredient in the recipe.
 * - Applies 50% coverage threshold; if fewer than 3 pass, returns top 5 sorted "Closest matches".
 * - Keeps at most 2 consecutive/top recipes sharing the exact same main ingredient set.
 *
 * @param {{ diet?: "veg"|"nonveg", mealType?: string, allergies?: string[], availableIngredientIds?: string[] }} filters
 * @returns {Array<object>}
 */
export function getRecipesForFilters({
  diet = "veg",
  mealType,
  allergies = [],
  availableIngredientIds = [],
} = {}) {
  const allergySet = new Set(Array.isArray(allergies) ? allergies : []);
  const ownedMainSet = new Set(
    (Array.isArray(availableIngredientIds) ? availableIngredientIds : []).filter(
      (id) => !getIngredientById(id)?.assumedAvailable
    )
  );

  if (ownedMainSet.size === 0) {
    return [];
  }

  const candidates = [];

  for (const recipe of RECIPES) {
    if (mealType && !recipe.mealTypes.includes(mealType)) continue;
    const evaluated = evaluateRecipeMatch(recipe, ownedMainSet, {
      diet,
      allergySet,
    });
    if (!evaluated || !evaluated.hasSelectedMainMatch) continue;
    const { hasSelectedMainMatch: _drop, ...cleanMatch } = evaluated;
    candidates.push(cleanMatch);
  }

  if (candidates.length === 0) {
    return [];
  }

  candidates.sort(compareRecipeMatches);

  const passing = candidates.filter((r) => r.matchScore >= 50);

  if (passing.length >= 3) {
    return diversifyMatchedRecipes(passing, 2).map((r) => ({
      ...r,
      isClosestMatch: false,
    }));
  }

  return diversifyMatchedRecipes(candidates, 2)
    .slice(0, 5)
    .map((r) => ({
      ...r,
      isClosestMatch: true,
    }));
}

/**
 * Scale a recipe's ingredient quantities to match the household serving multiplier.
 * @param {object} recipe
 * @param {{ adults?: number, children?: Array<{ ageGroup: "toddler"|"child"|"teen" }> }} household
 * @returns {{ householdMultiplier: number, scaleFactor: number, ingredients: Array<object> }}
 */
export function scaleServings(recipe, household) {
  const householdMultiplier = computeHouseholdMultiplier(household);
  const baseServings = Math.max(1, Number(recipe?.baseServings) || 1);
  const scaleFactor = Math.round((householdMultiplier / baseServings) * 1000) / 1000;

  const ingredients = (recipe?.ingredients ?? []).map((item) => ({
    ...item,
    scaledAmount: Math.round(item.amount * scaleFactor * 100) / 100,
  }));

  return {
    householdMultiplier,
    scaleFactor,
    ingredients,
  };
}

/**
 * Calculate estimated per-person and total household nutrition for a recipe.
 * @param {object} recipe
 * @param {{ adults?: number, children?: Array<{ ageGroup: "toddler"|"child"|"teen" }> }} household
 * @returns {{ householdMultiplier: number, perPerson: object, householdTotal: object }}
 */
export function totalNutrition(recipe, household) {
  const householdMultiplier = computeHouseholdMultiplier(household);
  const perPerson = { ...(recipe?.nutritionPerServing ?? {}) };
  const householdTotal = {};

  for (const [key, val] of Object.entries(perPerson)) {
    householdTotal[key] = Math.round(Number(val) * householdMultiplier * 10) / 10;
  }

  return {
    householdMultiplier,
    perPerson,
    householdTotal,
  };
}

// Self-tests
(function runSelfTests() {
  console.assert(INGREDIENTS.length >= 120, `Expected >= 120 ingredients, got ${INGREDIENTS.length}`);
  console.assert(RECIPES.length >= 40, `Expected >= 40 recipes, got ${RECIPES.length}`);

  const validCategories = new Set([
    "vegetables",
    "fruits",
    "meat_fish",
    "eggs_dairy",
    "grains_pulses",
    "spices_herbs",
    "pantry",
  ]);
  const validIngredientIcons = new Set([
    "leaf",
    "root",
    "fruit",
    "drop",
    "grain",
    "bean",
    "egg",
    "meat",
    "fish",
    "dairy",
    "spice",
    "bottle",
    "bowl",
    "pepper",
    "nut",
    "mushroom",
  ]);
  const categoryCounts = {
    vegetables: 0,
    fruits: 0,
    meat_fish: 0,
    eggs_dairy: 0,
    grains_pulses: 0,
    spices_herbs: 0,
    pantry: 0,
  };
  const seenIds = new Set();
  for (const ing of INGREDIENTS) {
    console.assert(!seenIds.has(ing.id), `Duplicate ingredient id: ${ing.id}`);
    seenIds.add(ing.id);
    console.assert(validCategories.has(ing.category), `Invalid category on ${ing.id}: ${ing.category}`);
    categoryCounts[ing.category] += 1;
    if (ing.category === "meat_fish") {
      console.assert(ing.isVeg === false, `Meat/fish item "${ing.id}" must have isVeg: false`);
    }
    console.assert(
      typeof ing.expiryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ing.expiryDate),
      `Invalid expiryDate on ${ing.id}: ${ing.expiryDate}`
    );
    const vis = ing.visual || INGREDIENT_VISUALS[ing.id];
    console.assert(
      vis && typeof vis.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(vis.color) && validIngredientIcons.has(vis.icon),
      `Invalid or missing visual on ingredient "${ing.id}"`
    );
  }
  console.assert(categoryCounts.vegetables >= 20, `Expected >= 20 vegetables, got ${categoryCounts.vegetables}`);
  console.assert(categoryCounts.fruits >= 12, `Expected >= 12 fruits, got ${categoryCounts.fruits}`);
  console.assert(categoryCounts.meat_fish >= 15, `Expected >= 15 meat_fish, got ${categoryCounts.meat_fish}`);
  console.assert(categoryCounts.eggs_dairy >= 12, `Expected >= 12 eggs_dairy, got ${categoryCounts.eggs_dairy}`);
  console.assert(categoryCounts.grains_pulses >= 20, `Expected >= 20 grains_pulses, got ${categoryCounts.grains_pulses}`);
  console.assert(categoryCounts.spices_herbs >= 25, `Expected >= 25 spices_herbs, got ${categoryCounts.spices_herbs}`);
  console.assert(categoryCounts.pantry >= 15, `Expected >= 15 pantry, got ${categoryCounts.pantry}`);

  const mealCounts = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  let vegNoEgg = 0;
  let vegWithEgg = 0;
  let nonVeg = 0;

  for (const recipe of RECIPES) {
    for (const mt of recipe.mealTypes) {
      if (mt in mealCounts) mealCounts[mt] += 1;
    }

    let containsNonVegIng = false;
    let containsEgg = false;
    for (const item of recipe.ingredients) {
      const ing = getIngredientById(item.ingredientId);
      console.assert(Boolean(ing), `Missing ingredientId "${item.ingredientId}" in recipe "${recipe.id}"`);
      if (ing && !ing.isVeg) containsNonVegIng = true;
      if (ing && ing.isEgg) containsEgg = true;
    }

    console.assert(
      !(recipe.diet === "veg" && containsNonVegIng),
      `Veg recipe "${recipe.id}" contains non-veg ingredient`
    );

    if (recipe.diet === "nonveg") nonVeg += 1;
    else if (containsEgg) vegWithEgg += 1;
    else vegNoEgg += 1;
  }

  for (const [meal, count] of Object.entries(mealCounts)) {
    console.assert(count >= 8, `Meal type "${meal}" has only ${count} recipes (need >= 8)`);
  }
  console.assert(vegNoEgg >= 12, `Expected >= 12 veg-without-egg recipes, got ${vegNoEgg}`);
  console.assert(vegWithEgg >= 8, `Expected >= 8 veg-with-egg recipes, got ${vegWithEgg}`);
  console.assert(nonVeg >= 12, `Expected >= 12 non-veg recipes, got ${nonVeg}`);

  const sampleScaled = scaleServings(RECIPES[0], { adults: 2, children: [{ ageGroup: "child" }] });
  console.assert(sampleScaled.householdMultiplier === 2.75, "Household multiplier math mismatch");

  const sampleNut = totalNutrition(RECIPES[0], { adults: 2, children: [] });
  console.assert(
    sampleNut.householdTotal.calories === RECIPES[0].nutritionPerServing.calories * 2,
    "Nutrition total math mismatch"
  );

  // Matching self-tests
  // 1. Selecting only Paneer and Spinach returns different top 3 IDs than Egg and Onion
  const paneerSpinachTop3 = getRecipesForFilters({
    diet: "veg",
    allergies: [],
    availableIngredientIds: ["paneer", "spinach"],
  })
    .slice(0, 3)
    .map((r) => r.id);
  const eggOnionTop3 = getRecipesForFilters({
    diet: "veg",
    allergies: [],
    availableIngredientIds: ["egg", "onion"],
  })
    .slice(0, 3)
    .map((r) => r.id);
  console.assert(
    paneerSpinachTop3.length >= 3 &&
      eggOnionTop3.length >= 3 &&
      paneerSpinachTop3.join(",") !== eggOnionTop3.join(","),
    `Expected different top 3 for Paneer+Spinach (${paneerSpinachTop3.join(",")}) vs Egg+Onion (${eggOnionTop3.join(",")})`
  );

  // 2. No recipe is returned when the selection contains no ingredient any recipe's main list uses
  const staplesOnlyMatches = getRecipesForFilters({
    diet: "veg",
    allergies: [],
    availableIngredientIds: ["salt", "oil", "water"],
  });
  console.assert(
    staplesOnlyMatches.length === 0,
    `Expected 0 matches for staples-only selection, got ${staplesOnlyMatches.length}`
  );
  const unusedMainMatches = getRecipesForFilters({
    diet: "veg",
    allergies: [],
    availableIngredientIds: ["kiwi"],
  });
  console.assert(
    unusedMainMatches.length === 0,
    `Expected 0 matches when selection uses no recipe main ingredients, got ${unusedMainMatches.length}`
  );

  // 3. Adding salt or oil to a selection does not change the match percentage of any recipe
  const withoutStaples = getRecipesForFilters({
    diet: "veg",
    mealType: "breakfast",
    allergies: [],
    availableIngredientIds: ["egg", "onion"],
  });
  const withStaples = getRecipesForFilters({
    diet: "veg",
    mealType: "breakfast",
    allergies: [],
    availableIngredientIds: ["egg", "onion", "salt", "oil", "turmeric"],
  });
  console.assert(
    withoutStaples.length === withStaples.length &&
      withoutStaples.every(
        (r, i) => withStaples[i].id === r.id && withStaples[i].matchScore === r.matchScore
      ),
    "Adding salt or oil must not change recipe match percentage"
  );

  // 4. Sort order follows coverage, then missing count, then used selected count, then total time
  const synthetic = [
    {
      id: "slow_two_miss",
      coverage: 0.5,
      matchScore: 50,
      missingRequiredCount: 2,
      usedSelectedCount: 2,
      prepMinutes: 20,
      cookMinutes: 20,
    },
    {
      id: "higher_cov",
      coverage: 0.75,
      matchScore: 75,
      missingRequiredCount: 1,
      usedSelectedCount: 3,
      prepMinutes: 30,
      cookMinutes: 30,
    },
    {
      id: "fast_one_miss",
      coverage: 0.5,
      matchScore: 50,
      missingRequiredCount: 1,
      usedSelectedCount: 2,
      prepMinutes: 5,
      cookMinutes: 10,
    },
    {
      id: "slower_one_miss",
      coverage: 0.5,
      matchScore: 50,
      missingRequiredCount: 1,
      usedSelectedCount: 2,
      prepMinutes: 10,
      cookMinutes: 15,
    },
  ];
  const sortedSynthetic = [...synthetic].sort(compareRecipeMatches).map((r) => r.id);
  console.assert(
    sortedSynthetic.join(",") === "higher_cov,fast_one_miss,slower_one_miss,slow_two_miss",
    `Unexpected sort order: ${sortedSynthetic.join(",")}`
  );
})();

