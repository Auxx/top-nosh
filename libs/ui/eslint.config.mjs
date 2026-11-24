import nx from "@nx/eslint-plugin";
import baseConfig from "../../eslint.config.mjs";

export default [
    ...nx.configs["flat/angular"],
    ...nx.configs["flat/angular-template"],
    ...baseConfig,
    {
        files: [
            "**/*.ts"
        ],
        rules: {
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "ui",
                    style: "camelCase"
                }
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "ui",
                    style: "kebab-case"
                }
            ]
        }
    },
    {
        // Storybook mirrors the app's setup, so it may read the shared domain
        // definitions. The library source itself stays type:ui-only.
        files: [
            ".storybook/**/*.ts"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    depConstraints: [
                        {
                            sourceTag: "type:ui",
                            onlyDependOnLibsWithTags: [
                                "type:ui",
                                "type:domain"
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.html"
        ],
        // Override or add rules here
        rules: {}
    }
];
