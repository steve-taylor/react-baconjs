# React Bacon.js Webpack configuration

The following webpack.config.js example demonstrates including `react-baconjs`
in your project.

```js
module.exports = {
    // Replace all occurrences of process.env.NODE_ENV with "production" via DefinePlugin.
    mode: 'production',
    entry: 'src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?/,
                // Skip transpiling everything in node_modules except react-baconjs.
                exclude: /node_modules\/(?!react-baconjs\/)/,
                loader: 'babel-loader',
                // The following presets and plugins are required to transpile react-baconjs.
                presets: [
                    '@babel/preset-env',
                    '@babel/preset-react'
                ],
                plugins: [
                    '@babel/plugin-transform-runtime',
                    '@babel/plugin-proposal-class-properties'
                ]
            }
        ]
    }
};
```

In the above example, note that

* all occurrences `process.env.NODE_ENV` are replaced with `"production"` (`"development"` is also valid);
* `react-baconjs` isn't skipped by `babel-loader`; and
*  the specified Babel presets and plugins are all required to transpile `react-baconjs`.
