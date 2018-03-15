module.exports = {
    "rules": {
        "comma-dangle": ["warn", "always-multiline"],
        "indent": [
            2,
            2
        ],
        "quotes": [
            2,
            "single"
        ],
        "linebreak-style": [
            2,
            "unix"
        ],
        "no-console": 0,
        "no-unused-vars": [
          2,
          {
            "vars": "all",
            "args": "none"
          }
        ],
        "semi": [
            2,
            "always"
        ]
    },
    "env": {
        "es6": true,
        "node": true,
        "jasmine": true
    },
    "extends": "eslint:recommended"
};
