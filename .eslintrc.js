module.exports = {
    extends: [
        'foxsports',
    ],
    rules: {
        'compat/compat': 0,
        'import/no-namespace': 0,                          // importing bacon.js in a way that supports all versions
        'react/static-property-placement': 0,              // need to remove propTypes from prod builds
    },
    globals: {
        process: 'readonly',
    },
};
