const path = require("path");

module.exports = {
  paths: function (paths, env) {
    paths.appIndexJs = path.resolve(__dirname, "apps/index.tsx");
    paths.appSrc = path.resolve(__dirname, "apps");
    return paths;
  },
};
