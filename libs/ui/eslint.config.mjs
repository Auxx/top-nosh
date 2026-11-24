import nx from "@nx/eslint-plugin";
import baseConfig, { moduleBoundaryOptions } from "../../eslint.config.mjs";

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
                    ...moduleBoundaryOptions,
                    depConstraints: moduleBoundaryOptions.depConstraints.map(constraint =>
                        constraint.sourceTag === "type:ui"
                            ? { ...constraint, onlyDependOnLibsWithTags: [ ...constraint.onlyDependOnLibsWithTags, "type:domain" ] }
                            : constraint
                    )
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
