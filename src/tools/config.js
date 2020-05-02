const Configstore = require("configstore");
const packageJson = require("../../package.json");

const getConfigName = () => {
  const environment = process.env.NODE_ENV;
  let configName = `${packageJson.name}-dev`;

  if (environment === "production") {
    configName = `${packageJson.name}-prod`;
  }

  return configName;
};

const config = new Configstore(getConfigName());

const getVaultData = () => {
  return config.get("data");
};

const setVaultData = (data) => {
  config.set("data", data);
};

const setBannerColor = () => {    
  const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;

  config.set("bannerColor", color);
};

const getBannerColor = () => {
  return config.get("bannerColor");
};

module.exports = {
  getVaultData,
  setVaultData,
  getBannerColor,
  setBannerColor,
};