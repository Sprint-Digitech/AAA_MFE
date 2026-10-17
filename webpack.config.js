const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  output: {
    uniqueName: "login",
    publicPath: "auto",
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "login",
      filename: "remoteEntry.js",
      exposes: {
        "./Component": "./src/app/app.component.ts",
      },
      shared: {
        "@angular/core": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/common": { singleton: true, strictVersion: false, requiredVersion: false },
        // Secondary entry point - NOT covered by sharing "@angular/common". Without it
        // each chunk bundled its own HttpClient class, so @fovestta2/chat-widget-fovestta's
        // ChatConnectionService injected a copy app.config's provideHttpClient never
        // registered -> NullInjectorError on every page and no chat icon.
        "@angular/common/http": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/router": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/platform-browser": { singleton: true, strictVersion: false, requiredVersion: false },
        "rxjs": { singleton: true, strictVersion: false, requiredVersion: false },
      },
    }),
  ],
};
