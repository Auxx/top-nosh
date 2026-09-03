# Cuisine and Category Bug

Select boxes for cuisine and category on `RecipeListPage` and `CreateRecipePage` are not populated.
The API is working correctly, but these select boxes are empty.

## API response example

```json
[
    {
        "cuisine": "Air fryer",
        "categories": [
            "Quick recipes"
        ]
    },
    {
        "cuisine": "Fusion",
        "categories": [
            "One pot dish"
        ]
    },
    {
        "cuisine": "Italian",
        "categories": [
            "Pasta",
            "Pizza"
        ]
    }
]
```

## Requirements

- Investigate why the data is not being being populated inside select boxes.
- Fix the issue.
