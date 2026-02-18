const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  output: {
    uniqueName: "shell",
    publicPath: "auto",
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new ModuleFederationPlugin({
      remotes: {
        login: "login@http://localhost:4204/remoteEntry.js",
        alms: "alms@http://localhost:4205/remoteEntry.js",
        salary: "salary@http://localhost:4206/remoteEntry.js",
        employee: "employee@http://localhost:4207/remoteEntry.js",
      },
      shared: {
        "@angular/core": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/common": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/router": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/platform-browser": { singleton: true, strictVersion: false, requiredVersion: false },
        "rxjs": { singleton: true, strictVersion: false, requiredVersion: false },
      },
    }),
  ],
};
