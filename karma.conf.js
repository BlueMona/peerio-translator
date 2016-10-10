module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: [
            'mocha', 'chai'
        ],
        files: ['translator.test.js', 'translator.js'],
        exclude: [],
        preprocessors: {},
        port: 9877,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome_Debug'],
        customLaunchers: {
            Chrome_Debug: {
                base: 'Chrome',
                flags: ['--user-data-dir=./.chrome_dev_user']
            }
        },
        singleRun: false,
        concurrency: Infinity
    });
};
