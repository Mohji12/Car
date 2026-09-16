import { getDb, vehiclesTable } from "@workspace/db";

const image = (id: number, width = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const seedVehicles = [
  {
    id: "cw-note-15",
    make: "Nissan",
    model: "Note",
    variant: "1.2",
    year: 2015,
    price: 2995,
    mileage: 96734,
    fuel: "Petrol",
    transmission: "Manual",
    bodyType: "Hatchback",
    colour: "Gray",
    location: "St Albans",
    status: "available",
    tags: ["new_arrival"],
    featured: true,
    description:
      "Part service history, fresh service at 96,734, MOT till 18.06.2026, 2 keys, 4 owners, sat nav, USB/AUX port, full electric windows, £20 year road tax, ISOFIX, HPI clear. Warranty available from 3, 6, 12 and 24 months. We accept all major credit / debit cards. P/X welcome.",
    highlights: [
      "MOT till 18.06.2026",
      "Fresh service at 96,734",
      "Sat nav",
      "2 keys",
      "HPI clear",
      "£20 year road tax",
    ],
    specs: [
      { label: "Engine", value: "1.2 litre" },
      { label: "Doors", value: "5" },
      { label: "Condition", value: "Used" },
      { label: "Owners", value: "4" },
    ],
    images: [image(116675), image(170811), image(112460), image(244206)],
    condition: "Used",
    doors: 5,
    engineSize: "1.2",
    registrationDate: "11/09/2015",
    registrationPlate: "VU65 YSO",
    videoUrl: null,
  },
  {
    id: "cw-2401",
    make: "BMW",
    model: "M4",
    variant: "Competition xDrive",
    year: 2022,
    price: 52990,
    mileage: 12400,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "Coupe",
    colour: "Isle of Man Green",
    location: "St Albans",
    status: "available",
    tags: ["featured"],
    featured: true,
    description:
      "A properly specified M4 with the composure to cross the country and the intent to make every clear road count. Presented with a complete history and prepared in-house.",
    highlights: [
      "M Sport Pro pack",
      "Carbon fibre trim",
      "Harman Kardon audio",
      "360° camera",
    ],
    specs: [
      { label: "Engine", value: "3.0 litre twin-turbo" },
      { label: "Power", value: "503 bhp" },
      { label: "0–62 mph", value: "3.5 seconds" },
      { label: "CO₂", value: "227 g/km" },
    ],
    images: [image(170811), image(116675), image(112460)],
    condition: "Used",
    doors: 2,
    engineSize: "3.0",
    registrationDate: null,
    registrationPlate: null,
    videoUrl: null,
  },
  {
    id: "cw-2398",
    make: "Porsche",
    model: "Macan",
    variant: "GTS",
    year: 2021,
    price: 47950,
    mileage: 23800,
    fuel: "Petrol",
    transmission: "Automatic",
    bodyType: "SUV",
    colour: "Crayon",
    location: "St Albans",
    status: "available",
    tags: ["featured"],
    featured: true,
    description:
      "The GTS is the Macan at its most convincing: quiet, quick and beautifully balanced. A refined everyday performance car with a considered specification.",
    highlights: [
      "Panoramic roof",
      "Sports exhaust",
      "Porsche Entry",
      "Adaptive cruise",
    ],
    specs: [
      { label: "Engine", value: "2.9 litre V6" },
      { label: "Power", value: "434 bhp" },
      { label: "0–62 mph", value: "4.5 seconds" },
      { label: "Service history", value: "Full Porsche" },
    ],
    images: [image(244206), image(170811), image(305070)],
    condition: "Used",
    doors: 5,
    engineSize: "2.9",
    registrationDate: null,
    registrationPlate: null,
    videoUrl: null,
  },
  {
    id: "cw-2387",
    make: "Mercedes-Benz",
    model: "C-Class",
    variant: "C300 AMG Line Premium",
    year: 2022,
    price: 31990,
    mileage: 18900,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "Saloon",
    colour: "Obsidian Black",
    location: "St Albans",
    status: "available",
    tags: ["featured"],
    featured: true,
    description:
      "A sharp, quiet and remarkably efficient C-Class with the right premium details. Its hybrid powertrain makes long journeys effortless.",
    highlights: [
      "Burmester audio",
      "Night package",
      "Heated seats",
      "MBUX navigation",
    ],
    specs: [
      { label: "Engine", value: "2.0 litre mild hybrid" },
      { label: "Power", value: "255 bhp" },
      { label: "Drive", value: "Rear wheel drive" },
      { label: "Owners", value: "1" },
    ],
    images: [image(112460), image(305070), image(244206)],
    condition: "Used",
    doors: 4,
    engineSize: "2.0",
    registrationDate: null,
    registrationPlate: null,
    videoUrl: null,
  },
  {
    id: "cw-2354",
    make: "Volvo",
    model: "XC60",
    variant: "B5 R-Design Pro",
    year: 2021,
    price: 34750,
    mileage: 30100,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    colour: "Crystal White",
    location: "St Albans",
    status: "sold",
    tags: [],
    featured: false,
    description:
      "Calm, confident and wonderfully ergonomic. A Volvo XC60 with understated style and all the thoughtful details.",
    highlights: [
      "Pilot Assist",
      "Harman Kardon",
      "Heated steering wheel",
      "360° camera",
    ],
    specs: [
      { label: "Engine", value: "2.0 litre mild hybrid" },
      { label: "Power", value: "247 bhp" },
      { label: "Owners", value: "1" },
      { label: "Warranty", value: "Sold" },
    ],
    images: [image(112460), image(305070), image(170811)],
    condition: "Used",
    doors: 5,
    engineSize: "2.0",
    registrationDate: null,
    registrationPlate: null,
    videoUrl: null,
  },
];

async function main() {
  const db = getDb();
  for (const vehicle of seedVehicles) {
    await db
      .insert(vehiclesTable)
      .values(vehicle)
      .onConflictDoUpdate({
        target: vehiclesTable.id,
        set: {
          ...vehicle,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Seeded ${seedVehicles.length} vehicles`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
