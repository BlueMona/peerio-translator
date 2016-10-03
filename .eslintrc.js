module.exports = {
    root: true,
    parser: 'babel-eslint',
    extends: [
        "peerio"
    ],
    rules:{
        'global-require': 0,
        'react/prefer-stateless-function': 0,
        'react/jsx-filename-extension': 0,
        'react/sort-comp': 0,
        'no-mixed-operators': 0
    },
    globals: {
        'requestAnimationFrame': false
    }
};
