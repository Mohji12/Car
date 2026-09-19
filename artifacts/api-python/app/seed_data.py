from __future__ import annotations


def _image(photo_id: int, width: int = 1200) -> str:
    return (
        f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg"
        f"?auto=compress&cs=tinysrgb&w={width}"
    )


SEED_VEHICLES: list[dict] = [
    {
        "id": "cw-note-15",
        "make": "Nissan",
        "model": "Note",
        "variant": "1.2",
        "year": 2015,
        "price": 2995,
        "mileage": 96734,
        "fuel": "Petrol",
        "transmission": "Manual",
        "bodyType": "Hatchback",
        "colour": "Gray",
        "location": "St Albans",
        "status": "available",
        "tags": ["new_arrival"],
        "featured": True,
        "description": (
            "Part service history, 96,734 miles, 4 owners, fresh service at 96,734, "
            "MOT till 18.06.2026, 2 keys, sat nav, USB/AUX port, full electric windows, "
            "£20 year road tax, ISOFIX, HPI clear. Warranty available from 3, 6, 12 and "
            "24 months. We accept all major credit / debit cards. P/X welcome."
        ),
        "highlights": [
            "MOT till 18.06.2026",
            "Fresh service at 96,734",
            "Sat nav",
            "2 keys",
            "HPI clear",
            "£20 year road tax",
        ],
        "specs": [
            {"label": "Engine", "value": "1.2 litre"},
            {"label": "Doors", "value": "5"},
            {"label": "Condition", "value": "Used"},
            {"label": "Owners", "value": "4"},
        ],
        "images": [_image(116675), _image(170811), _image(112460), _image(244206)],
        "condition": "Used",
        "doors": 5,
        "engineSize": "1.2",
        "registrationDate": "11/09/2015",
        "registrationPlate": "VU65 YSO",
        "videoUrl": None,
        "viewCount": 0,
        "addedAt": "2024-05-20T10:00:00.000Z",
        "updatedAt": "2024-05-20T10:00:00.000Z",
    },
    {
        "id": "cw-2401",
        "make": "BMW",
        "model": "M4",
        "variant": "Competition xDrive",
        "year": 2022,
        "price": 52990,
        "mileage": 12400,
        "fuel": "Petrol",
        "transmission": "Automatic",
        "bodyType": "Coupe",
        "colour": "Isle of Man Green",
        "location": "St Albans",
        "status": "available",
        "tags": ["featured"],
        "featured": True,
        "description": (
            "Full service history, 12,400 miles, 1 owner, M Sport Pro pack, carbon fibre trim, "
            "Harman Kardon audio, 360° camera, 2 keys, HPI clear. Warranty available "
            "from 3, 6, 12 and 24 months. We accept all major credit / debit cards. "
            "P/X welcome."
        ),
        "highlights": [
            "M Sport Pro pack",
            "Carbon fibre trim",
            "Harman Kardon audio",
            "360° camera",
        ],
        "specs": [
            {"label": "Engine", "value": "3.0 litre twin-turbo"},
            {"label": "Power", "value": "503 bhp"},
            {"label": "0–62 mph", "value": "3.5 seconds"},
            {"label": "Owners", "value": "1"},
        ],
        "images": [_image(170811), _image(116675), _image(112460)],
        "condition": "Used",
        "doors": 2,
        "engineSize": "3.0",
        "registrationDate": None,
        "registrationPlate": None,
        "videoUrl": None,
        "viewCount": 12,
        "addedAt": "2024-05-14T10:00:00.000Z",
        "updatedAt": "2024-05-14T10:00:00.000Z",
    },
    {
        "id": "cw-2398",
        "make": "Porsche",
        "model": "Macan",
        "variant": "GTS",
        "year": 2021,
        "price": 47950,
        "mileage": 23800,
        "fuel": "Petrol",
        "transmission": "Automatic",
        "bodyType": "SUV",
        "colour": "Crayon",
        "location": "St Albans",
        "status": "available",
        "tags": ["featured"],
        "featured": True,
        "description": (
            "Full Porsche service history, 23,800 miles, 1 owner, panoramic roof, sports exhaust, "
            "Porsche Entry, adaptive cruise, 2 keys, HPI clear. Warranty available from "
            "3, 6, 12 and 24 months. We accept all major credit / debit cards. P/X welcome."
        ),
        "highlights": [
            "Panoramic roof",
            "Sports exhaust",
            "Porsche Entry",
            "Adaptive cruise",
        ],
        "specs": [
            {"label": "Engine", "value": "2.9 litre V6"},
            {"label": "Power", "value": "434 bhp"},
            {"label": "Service history", "value": "Full Porsche"},
            {"label": "Owners", "value": "1"},
        ],
        "images": [_image(244206), _image(170811), _image(305070)],
        "condition": "Used",
        "doors": 5,
        "engineSize": "2.9",
        "registrationDate": None,
        "registrationPlate": None,
        "videoUrl": None,
        "viewCount": 8,
        "addedAt": "2024-05-10T10:00:00.000Z",
        "updatedAt": "2024-05-10T10:00:00.000Z",
    },
    {
        "id": "cw-2387",
        "make": "Mercedes-Benz",
        "model": "C-Class",
        "variant": "C300 AMG Line Premium",
        "year": 2022,
        "price": 31990,
        "mileage": 18900,
        "fuel": "Hybrid",
        "transmission": "Automatic",
        "bodyType": "Saloon",
        "colour": "Obsidian Black",
        "location": "St Albans",
        "status": "available",
        "tags": ["featured"],
        "featured": True,
        "description": (
            "Full service history, 18,900 miles, 1 owner, Burmester audio, Night package, "
            "heated seats, MBUX navigation, 2 keys, HPI clear. Warranty available from "
            "3, 6, 12 and 24 months. We accept all major credit / debit cards. P/X welcome."
        ),
        "highlights": [
            "Burmester audio",
            "Night package",
            "Heated seats",
            "MBUX navigation",
        ],
        "specs": [
            {"label": "Engine", "value": "2.0 litre mild hybrid"},
            {"label": "Power", "value": "255 bhp"},
            {"label": "Drive", "value": "Rear wheel drive"},
            {"label": "Owners", "value": "1"},
        ],
        "images": [_image(112460), _image(305070), _image(244206)],
        "condition": "Used",
        "doors": 4,
        "engineSize": "2.0",
        "registrationDate": None,
        "registrationPlate": None,
        "videoUrl": None,
        "viewCount": 5,
        "addedAt": "2024-05-03T10:00:00.000Z",
        "updatedAt": "2024-05-03T10:00:00.000Z",
    },
    {
        "id": "cw-2354",
        "make": "Volvo",
        "model": "XC60",
        "variant": "B5 R-Design Pro",
        "year": 2021,
        "price": 34750,
        "mileage": 30100,
        "fuel": "Hybrid",
        "transmission": "Automatic",
        "bodyType": "SUV",
        "colour": "Crystal White",
        "location": "St Albans",
        "status": "sold",
        "tags": [],
        "featured": False,
        "description": (
            "Full service history, 30,100 miles, 1 owner, Pilot Assist, Harman Kardon, "
            "heated steering wheel, 360° camera, 2 keys, HPI clear. Warranty available "
            "from 3, 6, 12 and 24 months. We accept all major credit / debit cards. "
            "P/X welcome."
        ),
        "highlights": [
            "Pilot Assist",
            "Harman Kardon",
            "Heated steering wheel",
            "360° camera",
        ],
        "specs": [
            {"label": "Engine", "value": "2.0 litre mild hybrid"},
            {"label": "Power", "value": "247 bhp"},
            {"label": "Owners", "value": "1"},
            {"label": "Warranty", "value": "Sold"},
        ],
        "images": [_image(112460), _image(305070), _image(170811)],
        "condition": "Used",
        "doors": 5,
        "engineSize": "2.0",
        "registrationDate": None,
        "registrationPlate": None,
        "videoUrl": None,
        "viewCount": 3,
        "addedAt": "2024-04-05T10:00:00.000Z",
        "updatedAt": "2024-04-05T10:00:00.000Z",
    },
]
