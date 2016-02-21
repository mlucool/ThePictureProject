var webpack = require('webpack');
var _ = require('lodash');

var baseConfig = {
    entry: [
        './src/web/client/index.jsx'
    ],
    module: {
        loaders: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            loader: 'react-hot!babel'
        }, {
            test: /\.css$/,
            loader: 'style!css!autoprefixer?browsers=last 2 versions'
        }, {
            test: /\.json$/,
            loader: 'json'
        }],
        noParse: /\.min\.js/
    },
    resolve: {
        extensions: ['', '.js', '.jsx', '.css', '.json']
    },
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'bundle.js'
    }
};

var dev = _.cloneDeep(baseConfig),
    prod = _.cloneDeep(baseConfig);

dev.entry.unshift('webpack-dev-server/client?http://localhost:8080', 'webpack/hot/only-dev-server');
_.assign(dev,
    {
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NoErrorsPlugin()
        ],
        debug: true,
        cache: true,
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './dist',
            hot: true
        }
    });

_.assign(prod,
    {
        devtool: 'source-map',
        plugins: [ // https://github.com/webpack/docs/wiki/optimization
            new webpack.optimize.OccurenceOrderPlugin(),
            // https://github.com/webpack/docs/wiki/list-of-plugins#dedupeplugin
            new webpack.optimize.DedupePlugin(),
            // https://github.com/webpack/docs/wiki/list-of-plugins#noerrorsplugin
            new webpack.NoErrorsPlugin(), // Errors will stop webpack creating modules
            // https://github.com/webpack/docs/wiki/list-of-plugins#uglifyjsplugin
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    screw_ie8: true, //eslint-disable-line camelcase
                    warnings: false
                }
            })
        ]
    });

module.exports = {
    dev: dev,
    prod: prod
};
