module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',   // import from '@env'
          path: '.env',         // path to your .env file
          safe: false,          // set to true if you want a .env.example check
          allowUndefined: true  // prevents errors if a var is missing
        }
      ]
    ]
  };
};