var webpack = require('webpack');

module.exports = {
    entry: [
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server',
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
    },
    devServer: {
        contentBase: './dist',
        hot: true
    },
    devtool: 'inline-source-map',
    debug: true,
    cache: true,
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ]
};
